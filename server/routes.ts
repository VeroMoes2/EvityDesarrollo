import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";

import OpenAI from "openai";
import { storage } from "./storage";
import { ConfluenceService } from "./confluenceService";
import { setupAuth, isAuthenticated, isAdmin } from "./localAuth";
import {
  uploadRateLimit,
  downloadRateLimit,
  previewRateLimit,
} from "./rateLimiter";
import {
  updateUserProfileSchema,
  insertQuestionnaireSchema,
  updateQuestionnaireSchema,
  insertWaitlistSchema,
} from "@shared/schema";

// LS-108: Enhanced security middleware
import {
  securityHeaders,
  inputSanitization,
  csrfProtection,
  loginRateLimit as securityLoginRateLimit,
  adminRateLimit as securityAdminRateLimit,
} from "./securityMiddleware";

import AuditLogger from "./auditLogger";
import { CheckEndService } from "./checkEndService.js";
import { normalizeAnalyteName } from "./analyteNormalizer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // LS-96-7: Aligned with fileValidation.ts ALLOWED_MIME_TYPES
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Return structured error for consistent JSON handling
      cb(new Error(`MULTER_INVALID_TYPE:${file.mimetype}`));
    }
  },
});

// Configure multer specifically for profile image uploads
const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
  },
  fileFilter: (req, file, cb) => {
    // Only allow image types for profile images
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Return structured error for consistent JSON handling
      cb(new Error(`MULTER_INVALID_TYPE:${file.mimetype}`));
    }
  },
});

// Conversation session store for AI chatbot
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  containsGreeting: boolean;
}

interface ConversationSession {
  conversationId: string;
  userId: string;
  history: ConversationMessage[];
  hasSentPersonalGreeting: boolean;
  createdAt: Date;
  lastActivityAt: Date;
}

const conversationStore = new Map<string, ConversationSession>();

// Helper: Detect if message contains a greeting
function containsGreeting(message: string): boolean {
  // Allow optional leading punctuation/whitespace before greeting words
  // This handles Spanish inverted punctuation: ¡Hola!, ¿Qué tal?, etc.
  const greetingPatterns =
    /^[¡!¿?\s]*(hola|buenos días|buenas tardes|buenas noches|qué tal|hey|saludos|buen día)/i;
  return greetingPatterns.test(message.trim());
}

// Helper: Generate conversation ID
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Clean old conversations (older than 24 hours)
setInterval(
  () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const [id, session] of conversationStore.entries()) {
      if (session.lastActivityAt < oneDayAgo) {
        conversationStore.delete(id);
      }
    }
  },
  60 * 60 * 1000,
); // Run cleanup every hour

export async function registerRoutes(app: Express): Promise<Server> {
  // LS-108: Apply security headers to all routes
  app.use(securityHeaders);

  // LS-108: Input sanitization for all requests
  app.use(inputSanitization);

  // Auth middleware (handles CSRF individually)
  // Auth middleware (handles CSRF individually)
  await setupAuth(app);

  // === Waitlist registration ===
  app.post("/api/waitlist", async (req, res) => {
    try {
      console.log("Waitlist registration attempt:", { body: req.body });
      const validatedData = insertWaitlistSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const entry = await storage.createWaitlistEntry(validatedData);
      console.log("Waitlist entry created successfully:", entry.id);
      res.status(201).json({ success: true, message: "Registro exitoso en la lista de espera", id: entry.id });
    } catch (error: any) {
      console.error("Error creating waitlist entry:", error.message || error);
      console.error("Error stack:", error.stack);
      console.error("Error code:", error.code);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      // Include more details in the response for debugging
      const errorMessage = error.code === '42P01' 
        ? "La tabla de lista de espera no existe en la base de datos de producción. Por favor, sincroniza la base de datos."
        : "Error al registrar en la lista de espera";
      res.status(500).json({ error: errorMessage, code: error.code });
    }
  });

  // === File upload (MULTER) ===
  const upload = multer();

  // === OCR de laboratorios ===
  app.post("/api/labs/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      // User is guaranteed to be authenticated by isAuthenticated middleware
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const userId = (req.user as any).id;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Construimos form-data para enviar al servidor Python
      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(
        "http://localhost:5001/labs/ocr",
        form,
        {
          headers: form.getHeaders(),
        },
      );

      const ocrResult = response.data;
      
      // Determine document type based on OCR result
      const tipoEstudioOcr = ocrResult.tipo_estudio || "laboratorio";
      const isLabDocument = tipoEstudioOcr === "laboratorio";
      const fileType = isLabDocument ? "lab" : "study";
      const defaultCategory = isLabDocument ? "Análisis de Laboratorio" : "Estudios de Imagen";
      const nombreEstudioOcr = ocrResult.nombre_estudio || (isLabDocument ? "Estudio de laboratorio" : "Estudio médico");

      // Save the document to medical_documents table with correct type
      let documentId: string | null = null;
      try {
        const savedDoc = await storage.createMedicalDocument({
          userId,
          filename: `${fileType}_${Date.now()}_${req.file.originalname}`,
          originalName: req.file.originalname,
          fileType: fileType,
          category: req.body.category || defaultCategory,
          subcategory: req.body.subcategory || nombreEstudioOcr,
          description: req.body.description || nombreEstudioOcr,
          mimeType: req.file.mimetype,
          fileSize: String(req.file.size),
          fileData: req.file.buffer.toString("base64"),
        });
        documentId = savedDoc.id;
      } catch (docError) {
        console.error("Error saving document:", docError);
        // Continue without document reference
      }

      // Extract and save analytes from OCR result
      let savedAnalytes: any[] = [];
      if (ocrResult.parsed && ocrResult.parsed.analitos && Array.isArray(ocrResult.parsed.analitos)) {
        // Use document-level fecha_estudio for all analytes
        let documentDate: Date | null = null;
        if (ocrResult.parsed.fecha_estudio) {
          const parsedDocDate = new Date(ocrResult.parsed.fecha_estudio);
          if (!isNaN(parsedDocDate.getTime())) {
            documentDate = parsedDocDate;
          }
        }
        
        const analytesToSave = ocrResult.parsed.analitos.map((a: any) => {
          // Use per-analyte date if available, otherwise fall back to document date
          let collectedDate: Date | null = documentDate;
          if (a.fecha) {
            const parsedDate = new Date(a.fecha);
            if (!isNaN(parsedDate.getTime())) {
              collectedDate = parsedDate;
            }
          }
          
          return {
            analyteName: normalizeAnalyteName(a.nombre || "Desconocido"),
            valueNumeric: String(a.valor),
            unit: a.unidad || "",
            referenceMin: null,
            referenceMax: null,
            referenceText: null,
            notes: a.observaciones || null,
            collectedAt: collectedDate,
            sourceDocumentId: documentId,
          };
        });

        console.log(`OCR extracted ${ocrResult.parsed.analitos.length} analytes, preparing to save ${analytesToSave.length}`);
        console.log("Analytes to save:", JSON.stringify(analytesToSave.map(a => a.analyteName)));
        
        if (analytesToSave.length > 0) {
          try {
            savedAnalytes = await storage.saveLabAnalytesBatch(userId, analytesToSave);
            console.log(`Saved ${savedAnalytes.length} analytes for user ${userId}`);
            if (savedAnalytes.length !== analytesToSave.length) {
              console.warn(`MISMATCH: Tried to save ${analytesToSave.length} but only ${savedAnalytes.length} were saved`);
            }
          } catch (saveError) {
            console.error("Error saving analytes:", saveError);
          }
        }
      }

      // Audit log
      try {
        await storage.createAuditLog({
          userId,
          userEmail: (req.user as any).email || "unknown",
          action: "LAB_OCR_UPLOAD",
          resource: documentId,
          details: {
            filename: req.file.originalname,
            analytesExtracted: ocrResult.parsed?.analitos?.length || 0,
            analytesSaved: savedAnalytes.length,
          },
          outcome: "SUCCESS",
          riskLevel: "LOW",
          ipAddress: req.ip || null,
          userAgent: req.headers["user-agent"] || null,
          sessionId: req.sessionID || null,
          timestamp: new Date(),
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError);
      }

      const exportJson = ocrResult.export_json ? {
        ...ocrResult.export_json,
        user_id: userId,
      } : null;

      let message = "";
      if (isLabDocument) {
        message = `Se procesaron ${ocrResult.parsed?.analitos?.length || 0} analitos y se guardaron ${savedAnalytes.length} en la base de datos`;
      } else {
        message = `Documento guardado: ${nombreEstudioOcr}`;
      }

      return res.json({
        ...ocrResult,
        documentId,
        savedAnalytes: savedAnalytes.length,
        export_json: exportJson,
        tipo_estudio: tipoEstudioOcr,
        nombre_estudio: nombreEstudioOcr,
        fileType: fileType,
        message,
      });
    } catch (error: any) {
      console.error("OCR error:", error?.response?.data || error.message);
      return res.status(500).json({
        error: "Error procesando el archivo",
        details: error?.response?.data || error.message,
      });
    }
  });

  // === Lab Analytes GET endpoints ===
  
  // Get all analytes for authenticated user
  app.get("/api/labs/analytes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytes = await storage.getUserLabAnalytes(userId);
      return res.json({ analytes });
    } catch (error: any) {
      console.error("Error fetching analytes:", error.message);
      return res.status(500).json({ error: "Error obteniendo analitos" });
    }
  });

  // Get latest value for each analyte (summary view)
  app.get("/api/labs/analytes/latest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytes = await storage.getLatestAnalytesForUser(userId);
      return res.json({ analytes });
    } catch (error: any) {
      console.error("Error fetching latest analytes:", error.message);
      return res.status(500).json({ error: "Error obteniendo analitos" });
    }
  });

  // Get history for a specific analyte (for charts/trends)
  app.get("/api/labs/analytes/history/:analyteName", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analyteName } = req.params;
      
      if (!analyteName) {
        return res.status(400).json({ error: "Nombre de analito requerido" });
      }
      
      const history = await storage.getAnalyteHistory(userId, decodeURIComponent(analyteName));
      return res.json({ analyteName, history });
    } catch (error: any) {
      console.error("Error fetching analyte history:", error.message);
      return res.status(500).json({ error: "Error obteniendo historial de analito" });
    }
  });

  // === Analyte Comments endpoints ===
  
  // Get comments for a specific analyte
  app.get("/api/labs/analytes/comments/:analyteName", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analyteName } = req.params;
      
      if (!analyteName) {
        return res.status(400).json({ error: "Nombre de analito requerido" });
      }
      
      const comments = await storage.getAnalyteComments(userId, decodeURIComponent(analyteName));
      return res.json({ comments });
    } catch (error: any) {
      console.error("Error fetching analyte comments:", error.message);
      return res.status(500).json({ error: "Error obteniendo comentarios" });
    }
  });

  // Create a new comment for an analyte
  app.post("/api/labs/analytes/comments/:analyteName", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analyteName } = req.params;
      const { comment } = req.body;
      
      if (!analyteName) {
        return res.status(400).json({ error: "Nombre de analito requerido" });
      }
      
      if (!comment || comment.trim() === "") {
        return res.status(400).json({ error: "El comentario no puede estar vacío" });
      }
      
      const newComment = await storage.createAnalyteComment(userId, decodeURIComponent(analyteName), comment.trim());
      return res.status(201).json({ comment: newComment });
    } catch (error: any) {
      console.error("Error creating analyte comment:", error.message);
      return res.status(500).json({ error: "Error creando comentario" });
    }
  });

  // Delete a comment
  app.delete("/api/labs/analytes/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      if (!commentId) {
        return res.status(400).json({ error: "ID de comentario requerido" });
      }
      
      await storage.deleteAnalyteComment(userId, commentId);
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting analyte comment:", error.message);
      return res.status(500).json({ error: "Error eliminando comentario" });
    }
  });

  // Export lab data as JSON for external processing
  app.get("/api/labs/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const analytes = await storage.getUserLabAnalytes(userId);
      
      const exportData = {
        nombre_paciente: `${user.firstName} ${user.lastName}`,
        user_id: userId,
        fecha_exportacion: new Date().toISOString().split('T')[0],
        biomarcadores: analytes.map((a: any) => ({
          nombre: a.analyteName,
          valor: a.valueNumeric,
          unidad: a.unit,
          fecha_recoleccion: a.collectedAt ? new Date(a.collectedAt).toISOString().split('T')[0] : null,
          notas: a.notes || null
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="laboratorio_${userId}_${Date.now()}.json"`);
      return res.json(exportData);
    } catch (error: any) {
      console.error("Error exporting lab data:", error.message);
      return res.status(500).json({ error: "Error exportando datos de laboratorio" });
    }
  });

  // Reprocess existing lab documents to extract analytes (admin/migration endpoint)
  app.post("/api/labs/reprocess/:documentId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { documentId } = req.params;

      // Get the document from database
      const document = await storage.getMedicalDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Documento no encontrado" });
      }

      // Verify user owns this document or is admin
      if (document.userId !== userId) {
        return res.status(403).json({ error: "No tienes permiso para reprocesar este documento" });
      }

      if (!document.fileData) {
        return res.status(400).json({ error: "El documento no tiene datos de archivo" });
      }

      // Convert base64 back to buffer
      const fileBuffer = Buffer.from(document.fileData, "base64");
      
      // Send to OCR service
      const form = new FormData();
      form.append("file", fileBuffer, {
        filename: document.originalName,
        contentType: document.mimeType,
      });

      const response = await axios.post(
        "http://localhost:5001/labs/ocr",
        form,
        {
          headers: form.getHeaders(),
        },
      );

      const ocrResult = response.data;

      // Extract and save analytes
      let savedAnalytes: any[] = [];
      if (ocrResult.parsed && ocrResult.parsed.analitos && Array.isArray(ocrResult.parsed.analitos)) {
        // Use document-level fecha_estudio for all analytes
        let documentDate: Date | null = null;
        if (ocrResult.parsed.fecha_estudio) {
          const parsedDocDate = new Date(ocrResult.parsed.fecha_estudio);
          if (!isNaN(parsedDocDate.getTime())) {
            documentDate = parsedDocDate;
          }
        }
        
        const analytesToSave = ocrResult.parsed.analitos.map((a: any) => {
          let collectedDate: Date | null = documentDate;
          if (a.fecha) {
            const parsedDate = new Date(a.fecha);
            if (!isNaN(parsedDate.getTime())) {
              collectedDate = parsedDate;
            }
          }
          
          return {
            analyteName: normalizeAnalyteName(a.nombre || "Desconocido"),
            valueNumeric: String(a.valor),
            unit: a.unidad || "",
            referenceMin: null,
            referenceMax: null,
            referenceText: null,
            notes: a.observaciones || null,
            collectedAt: collectedDate,
            sourceDocumentId: documentId,
          };
        });

        if (analytesToSave.length > 0) {
          try {
            savedAnalytes = await storage.saveLabAnalytesBatch(userId, analytesToSave);
            console.log(`Reprocessed: Saved ${savedAnalytes.length} analytes for document ${documentId}`);
          } catch (saveError) {
            console.error("Error saving analytes during reprocess:", saveError);
          }
        }
      }

      return res.json({
        success: true,
        documentId,
        ocrResult,
        savedAnalytes: savedAnalytes.length,
        message: `Se reprocesó el documento y se guardaron ${savedAnalytes.length} analitos`,
      });
    } catch (error: any) {
      console.error("Reprocess error:", error?.response?.data || error.message);
      return res.status(500).json({
        error: "Error reprocesando el documento",
        details: error?.response?.data || error.message,
      });
    }
  });

  // Reprocess all lab documents for a user
  app.post("/api/labs/reprocess-all", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      // Get all lab documents for this user
      const documents = await storage.getMedicalDocumentsByType(userId, "lab");
      
      if (!documents || documents.length === 0) {
        return res.json({ 
          success: true, 
          message: "No hay documentos de laboratorio para reprocesar",
          processed: 0,
          totalAnalytes: 0
        });
      }

      let totalAnalytes = 0;
      const results: any[] = [];

      for (const doc of documents) {
        if (!doc.fileData) {
          results.push({ documentId: doc.id, status: "skipped", reason: "No file data" });
          continue;
        }

        try {
          const fileBuffer = Buffer.from(doc.fileData, "base64");
          
          const form = new FormData();
          form.append("file", fileBuffer, {
            filename: doc.originalName,
            contentType: doc.mimeType,
          });

          const response = await axios.post(
            "http://localhost:5001/labs/ocr",
            form,
            {
              headers: form.getHeaders(),
            },
          );

          const ocrResult = response.data;

          if (ocrResult.parsed && ocrResult.parsed.analitos && Array.isArray(ocrResult.parsed.analitos)) {
            // Use document-level fecha_estudio for all analytes
            let documentDate: Date | null = null;
            if (ocrResult.parsed.fecha_estudio) {
              const parsedDocDate = new Date(ocrResult.parsed.fecha_estudio);
              if (!isNaN(parsedDocDate.getTime())) {
                documentDate = parsedDocDate;
              }
            }
            
            const analytesToSave = ocrResult.parsed.analitos.map((a: any) => {
              let collectedDate: Date | null = documentDate;
              if (a.fecha) {
                const parsedDate = new Date(a.fecha);
                if (!isNaN(parsedDate.getTime())) {
                  collectedDate = parsedDate;
                }
              }
              
              return {
                analyteName: normalizeAnalyteName(a.nombre || "Desconocido"),
                valueNumeric: String(a.valor),
                unit: a.unidad || "",
                referenceMin: null,
                referenceMax: null,
                referenceText: null,
                notes: a.observaciones || null,
                collectedAt: collectedDate,
                sourceDocumentId: doc.id,
              };
            });

            if (analytesToSave.length > 0) {
              const savedAnalytes = await storage.saveLabAnalytesBatch(userId, analytesToSave);
              totalAnalytes += savedAnalytes.length;
              results.push({ 
                documentId: doc.id, 
                originalName: doc.originalName,
                status: "success", 
                analytesFound: ocrResult.parsed.analitos.length,
                analytesSaved: savedAnalytes.length 
              });
            }
          } else {
            results.push({ documentId: doc.id, status: "no_analytes", reason: "OCR no encontró analitos" });
          }
        } catch (docError: any) {
          results.push({ documentId: doc.id, status: "error", reason: docError.message });
        }
      }

      return res.json({
        success: true,
        processed: documents.length,
        totalAnalytes,
        results,
        message: `Se reprocesaron ${documents.length} documentos y se guardaron ${totalAnalytes} analitos`,
      });
    } catch (error: any) {
      console.error("Reprocess all error:", error.message);
      return res.status(500).json({
        error: "Error reprocesando documentos",
        details: error.message,
      });
    }
  });

  // LS-108: CSRF protection for protected routes
  app.use("/api", (req, res, next) => {
    // Skip CSRF for GET requests only (safe methods)
    // POST auth endpoints now have individual CSRF protection in localAuth.ts
    // Skip upload endpoints that have CSRF protection after multer processing
    if (
      req.method === "GET" ||
      req.method === "HEAD" ||
      req.method === "OPTIONS"
    ) {
      return next();
    }
    // Skip upload endpoints - they have individual CSRF protection after multer
    if (req.path.includes("/upload")) {
      return next();
    }
    return csrfProtection(req, res, next);
  });

  // LS-108: CSRF protection applied selectively (not to auth routes)
  // Auth routes handle CSRF individually to avoid token bootstrap issues

  // LS-108: CSRF token endpoint for frontend
  // LS-108: CSRF token endpoint with explicit protection and security headers
  app.get(
    "/api/csrf-token",
    (req, res, next) => {
      // Security: Require X-Requested-With header to prevent cross-site requests
      const requestedWith = req.headers["x-requested-with"];
      if (requestedWith !== "XMLHttpRequest") {
        return res.status(403).json({
          message: "CSRF endpoint requires X-Requested-With header",
          code: "INVALID_REQUEST_HEADER",
        });
      }

      // Apply CSRF protection to get/generate token
      csrfProtection(req, res, next);
    },
    (req, res) => {
      // Security headers for CSRF endpoint
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      res.json({ csrfToken: res.locals.csrfToken });
    },
  );

  // Auth routes - handled by localAuth.ts now
  // The /api/auth/user endpoint is now handled in localAuth.ts

  // LS-96: Medical documents endpoints for user profile system
  // LS-102: Enhanced endpoint with pagination and search for medical documents listing
  app.get(
    "/api/profile/medical-documents",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Parse query parameters for pagination and search
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = (req.query.search as string) || "";

        // Use paginated method for better performance and UX
        const result = await storage.getUserMedicalDocumentsPaginated(userId, {
          page,
          limit,
          search: search.trim() || undefined,
        });

        res.json(result);
      } catch (error) {
        console.error("Error fetching medical documents:", error);
        res
          .status(500)
          .json({ message: "Error al obtener los archivos médicos" });
      }
    },
  );

  app.post(
    "/api/profile/medical-documents",
    isAuthenticated,
    async (req: any, res) => {
      try {
        // Import validation schema
        const { insertMedicalDocumentSchema } = await import("@shared/schema");

        const userId = req.user.claims.sub;

        // Validate request body with schema
        const validationResult = insertMedicalDocumentSchema.safeParse({
          ...req.body,
          userId,
        });

        if (!validationResult.success) {
          return res.status(400).json({
            message: "Invalid request data",
            errors: validationResult.error.issues,
          });
        }

        const document = await storage.createMedicalDocument(
          validationResult.data,
        );
        res.json({ document });
      } catch (error) {
        console.error("Error creating medical document:", error);
        res.status(500).json({ message: "Failed to create medical document" });
      }
    },
  );

  // LS-128: Get document categories endpoint for unified document management
  app.get(
    "/api/profile/medical-documents/categories",
    isAuthenticated,
    async (req: any, res) => {
      try {
        // Import category definitions
        const { documentCategories } = await import("@shared/schema");

        res.json({
          categories: documentCategories,
          message: "Document categories retrieved successfully",
        });
      } catch (error) {
        console.error("Error fetching document categories:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch document categories" });
      }
    },
  );

  app.delete(
    "/api/profile/medical-documents/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { id } = req.params;

        // Security: Check ownership before deletion
        const deletedCount = await storage.deleteMedicalDocumentByOwner(
          userId,
          id,
        );

        if (deletedCount === 0) {
          return res
            .status(404)
            .json({ message: "Document not found or access denied" });
        }

        // LS-96-7: Audit logging for medical document deletions
        console.log(
          `AUDIT: Medical document deleted - User: ${userId}, Document: ${id}`,
        );

        res.json({ message: "Document deleted successfully" });
      } catch (error) {
        console.error("Error deleting medical document:", error);
        res.status(500).json({ message: "Failed to delete medical document" });
      }
    },
  );

  // LS-101: Update user profile endpoint
  app.patch("/api/profile/update", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get current user data to check for email changes
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Validate request body with schema
      const validationResult = updateUserProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.issues,
        });
      }

      // Check if trying to update email to an existing one
      const { email, ...otherData } = validationResult.data;
      let emailChanged = false;

      if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
        emailChanged = true;
        const existingUser = await storage.getUserByEmail(email.toLowerCase());
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({
            message: "Este email ya está registrado",
            field: "email",
          });
        }
      }

      // Prepare update data with email verification reset if email changed
      const updateData: any = { ...otherData };
      if (email) {
        updateData.email = email.toLowerCase();
        if (emailChanged) {
          // Reset email verification status when email changes
          updateData.isEmailVerified = "false";
          updateData.emailVerificationToken = null;
          updateData.emailVerificationExpires = null;
        }
      }

      // Update user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);

      // Remove sensitive data from response
      const {
        password,
        passwordResetToken,
        passwordResetExpires,
        emailVerificationToken,
        emailVerificationExpires,
        ...userResponse
      } = updatedUser;

      res.json({
        message: "Perfil actualizado exitosamente",
        user: userResponse,
        emailChanged: emailChanged,
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);

      // Handle database unique constraint errors (email already exists)
      if (error.code === "23505" && error.detail?.includes("email")) {
        return res.status(400).json({
          field: "email",
          message: "Este email ya está registrado",
        });
      }

      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Profile image upload endpoint
  app.post(
    "/api/profile/upload-image",
    isAuthenticated,
    uploadRateLimit,
    (req: any, res: any, next: any) => {
      profileImageUpload.single("image")(req, res, (err: any) => {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message: "La imagen excede el límite de 5MB",
              type: "VALIDATION_ERROR",
            });
          }
          // Handle invalid file type errors from multer
          if (err.message && err.message.startsWith("MULTER_INVALID_TYPE:")) {
            return res.status(400).json({
              message: "Solo se permiten imágenes (JPEG, PNG, GIF, WebP)",
              type: "VALIDATION_ERROR",
            });
          }
          return res.status(400).json({
            message: "Error al subir la imagen",
            type: "UPLOAD_ERROR",
          });
        }
        next();
      });
    },
    csrfProtection,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const file = req.file;

        if (!file) {
          return res
            .status(400)
            .json({ message: "No se recibió ninguna imagen" });
        }

        // Defense in depth: Validate file type again (multer already filtered)
        const allowedImageTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedImageTypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: "Solo se permiten imágenes (JPEG, PNG, GIF, WebP)",
            type: "VALIDATION_ERROR",
          });
        }

        // Defense in depth: Validate file size again (multer already limited)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return res.status(400).json({
            message: "La imagen no puede superar los 5MB",
            type: "VALIDATION_ERROR",
          });
        }

        // Convert image to base64 data URL
        const base64Image = file.buffer.toString("base64");
        const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

        // Update user profile with image URL
        const updatedUser = await storage.updateUserProfile(userId, {
          profileImageUrl: dataUrl,
        });

        console.log(
          `AUDIT: Profile image uploaded - User: ${userId}, Size: ${file.size}`,
        );

        const {
          password,
          passwordResetToken,
          passwordResetExpires,
          emailVerificationToken,
          emailVerificationExpires,
          ...userResponse
        } = updatedUser;

        res.json({
          message: "Imagen de perfil actualizada exitosamente",
          profileImageUrl: dataUrl,
          user: userResponse,
        });
      } catch (error) {
        console.error("Error uploading profile image:", error);
        res.status(500).json({ message: "Error al subir la imagen de perfil" });
      }
    },
  );

  // File upload endpoint with enhanced security validations and multer error handling
  // LS-108: Explicit CSRF protection after multer processes FormData
  app.post(
    "/api/profile/medical-documents/upload",
    isAuthenticated,
    uploadRateLimit,
    (req: any, res: any, next: any) => {
      upload.single("file")(req, res, (err: any) => {
        if (err) {
          // LS-96-7: Handle multer errors with consistent JSON response
          if (err.message.startsWith("MULTER_INVALID_TYPE:")) {
            const mimeType = err.message.split(":")[1];
            return res.status(400).json({
              message: `Tipo de archivo '${mimeType}' no permitido para documentos médicos`,
              type: "VALIDATION_ERROR",
            });
          } else if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message: "El archivo excede el límite de 10MB",
              type: "VALIDATION_ERROR",
            });
          } else {
            return res.status(400).json({
              message: "Error en la carga del archivo",
              type: "UPLOAD_ERROR",
            });
          }
        }
        next();
      });
    },
    csrfProtection,
    async (req: any, res) => {
      try {
        // Import validation schema and security utilities
        const { insertMedicalDocumentSchema } = await import("@shared/schema");
        const { validateMedicalFile, sanitizeFileData } = await import(
          "./fileValidation"
        );

        const userId = req.user.claims.sub;
        const file = req.file;
        const { fileType, originalName, category, subcategory, description } =
          req.body;

        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // LS-96-7: Enhanced file validation with magic number verification
        const validationResult = validateMedicalFile(file);

        if (!validationResult.isValid) {
          console.warn(
            `File validation failed for user ${userId}: ${validationResult.error}`,
          );
          return res.status(400).json({
            message: validationResult.error,
            type: "VALIDATION_ERROR",
          });
        }

        // Log security warnings if any
        if (validationResult.securityWarnings) {
          console.warn(
            `Security warnings for upload from user ${userId}:`,
            validationResult.securityWarnings,
          );
        }

        // Sanitize file data for secure storage
        const sanitizedFileData = sanitizeFileData(file.buffer);

        // Run OCR analysis to detect if document contains lab analytes
        let detectedFileType = fileType;
        let detectedCategory = category || "Documentos Médicos";
        let detectedSubcategory = subcategory || null;
        let detectedDescription = description || null;
        let savedAnalytes: any[] = [];
        
        // Only run OCR for PDF/image files that might be labs
        const ocrCompatibleTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (ocrCompatibleTypes.includes(file.mimetype)) {
          try {
            const ocrForm = new FormData();
            ocrForm.append("file", file.buffer, {
              filename: file.originalname,
              contentType: file.mimetype,
            });
            
            const ocrResponse = await axios.post(
              "http://localhost:5001/labs/ocr",
              ocrForm,
              { headers: ocrForm.getHeaders(), timeout: 120000 }
            );
            
            const ocrResult = ocrResponse.data;
            const tipoEstudioOcr = ocrResult.tipo_estudio || "documento_medico";
            const hasAnalytes = ocrResult.parsed?.analitos?.length > 0;
            
            // If OCR detected analytes, override to lab type
            if (hasAnalytes || tipoEstudioOcr === "laboratorio") {
              detectedFileType = "lab";
              detectedCategory = "Análisis de Laboratorio";
              detectedSubcategory = ocrResult.nombre_estudio || "Resultados de laboratorio";
              detectedDescription = `Laboratorio detectado automáticamente con ${ocrResult.parsed?.analitos?.length || 0} analitos`;
              console.log(`OCR detected lab document with ${ocrResult.parsed?.analitos?.length} analytes - reclassifying from study to lab`);
            } else if (tipoEstudioOcr === "estudio_imagen") {
              detectedFileType = "study";
              detectedCategory = "Estudios de Imagen";
              detectedSubcategory = ocrResult.nombre_estudio || subcategory;
            }
            
            // Save the document first to get documentId
            const documentData = {
              userId,
              fileType: detectedFileType,
              category: detectedCategory,
              subcategory: detectedSubcategory,
              description: detectedDescription,
              originalName: originalName || file.originalname,
              filename: `${detectedFileType}_${Date.now()}_${file.originalname}`,
              fileSize: file.size.toString(),
              mimeType: file.mimetype,
              fileData: sanitizedFileData,
            };

            const schemaValidationResult = insertMedicalDocumentSchema.safeParse(documentData);
            if (!schemaValidationResult.success) {
              return res.status(400).json({
                message: "Invalid file data",
                errors: schemaValidationResult.error.issues,
                type: "SCHEMA_VALIDATION_ERROR",
              });
            }

            const document = await storage.createMedicalDocument(schemaValidationResult.data);
            
            // If we detected analytes, save them
            if (hasAnalytes && ocrResult.parsed?.analitos) {
              // Use document-level fecha_estudio for all analytes
              let documentDate: Date | null = null;
              if (ocrResult.parsed.fecha_estudio) {
                const parsedDocDate = new Date(ocrResult.parsed.fecha_estudio);
                if (!isNaN(parsedDocDate.getTime())) {
                  documentDate = parsedDocDate;
                }
              }
              
              const analytesToSave = ocrResult.parsed.analitos.map((a: any) => {
                let collectedDate: Date | null = documentDate;
                if (a.fecha) {
                  const parsedDate = new Date(a.fecha);
                  if (!isNaN(parsedDate.getTime())) {
                    collectedDate = parsedDate;
                  }
                }
                return {
                  analyteName: normalizeAnalyteName(a.nombre || "Desconocido"),
                  valueNumeric: String(a.valor),
                  unit: a.unidad || "",
                  referenceMin: null,
                  referenceMax: null,
                  referenceText: null,
                  notes: a.observaciones || null,
                  collectedAt: collectedDate,
                  sourceDocumentId: document.id,
                };
              });
              
              if (analytesToSave.length > 0) {
                savedAnalytes = await storage.saveLabAnalytesBatch(userId, analytesToSave);
                console.log(`Saved ${savedAnalytes.length} analytes from reclassified document`);
              }
            }
            
            console.log(`AUDIT: Medical document uploaded with OCR - User: ${userId}, Document: ${document.id}, DetectedType: ${detectedFileType}, OriginalType: ${fileType}`);
            
            return res.json({
              message: detectedFileType !== fileType 
                ? `Documento reclasificado automáticamente como ${detectedFileType === 'lab' ? 'laboratorio' : 'estudio'}`
                : "File uploaded successfully",
              document: {
                id: document.id,
                originalName: document.originalName,
                fileSize: document.fileSize,
                uploadedAt: document.uploadedAt,
              },
              reclassified: detectedFileType !== fileType,
              detectedType: detectedFileType,
              savedAnalytes: savedAnalytes.length,
            });
          } catch (ocrError) {
            console.log("OCR analysis skipped or failed, proceeding with original classification:", ocrError);
            // Continue with normal save if OCR fails
          }
        }
        
        // Fallback: save without OCR analysis
        const documentData = {
          userId,
          fileType: detectedFileType,
          category: detectedCategory,
          subcategory: detectedSubcategory,
          description: detectedDescription,
          originalName: originalName || file.originalname,
          filename: `${Date.now()}_${file.originalname}`,
          fileSize: file.size.toString(),
          mimeType: file.mimetype,
          fileData: sanitizedFileData,
        };

        // Validate document data with schema
        const schemaValidationResult =
          insertMedicalDocumentSchema.safeParse(documentData);

        if (!schemaValidationResult.success) {
          return res.status(400).json({
            message: "Invalid file data",
            errors: schemaValidationResult.error.issues,
            type: "SCHEMA_VALIDATION_ERROR",
          });
        }

        const document = await storage.createMedicalDocument(
          schemaValidationResult.data,
        );

        // LS-96-7: Enhanced audit logging for medical document uploads (PHI-safe)
        console.log(
          `AUDIT: Medical document uploaded - User: ${userId}, Document: ${document.id}, Type: ${fileType}, Size: ${file.size}`,
        );

        res.json({
          message: "File uploaded successfully",
          document: {
            id: document.id,
            originalName: document.originalName,
            fileSize: document.fileSize,
            uploadedAt: document.uploadedAt,
          },
          securityInfo: validationResult.securityWarnings
            ? {
                warnings: validationResult.securityWarnings,
              }
            : undefined,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Failed to upload file" });
      }
    },
  );

  // File download endpoint with enhanced security
  app.get(
    "/api/profile/medical-documents/:id/download",
    isAuthenticated,
    downloadRateLimit,
    async (req: any, res) => {
      try {
        // Import security utilities
        const { getSecureFileHeaders } = await import("./fileValidation");

        const userId = req.user.claims.sub;
        const documentId = req.params.id;

        const document = await storage.getMedicalDocumentByOwner(
          documentId,
          userId,
        );

        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }

        // Validate fileData exists
        if (!document.fileData) {
          console.error(
            `AUDIT: File data not found for document ${documentId} - User: ${userId}`,
          );
          return res.status(500).json({ message: "File data not available" });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(document.fileData, "base64");

        // LS-96-7: Enhanced security headers for file downloads
        const secureHeaders = getSecureFileHeaders(
          document.originalName,
          document.mimeType,
          false,
        );
        res.set({
          ...secureHeaders,
          "Content-Length": fileBuffer.length.toString(),
        });

        // LS-96-7: Audit logging for medical document downloads (PHI-safe)
        console.log(
          `AUDIT: Medical document downloaded - User: ${userId}, Document: ${documentId}, Size: ${fileBuffer.length}`,
        );

        res.send(fileBuffer);
      } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ message: "Failed to download file" });
      }
    },
  );

  // File preview endpoint with enhanced security (inline display)
  app.get(
    "/api/profile/medical-documents/:id/preview",
    isAuthenticated,
    previewRateLimit,
    async (req: any, res) => {
      try {
        // Import security utilities
        const { getSecureFileHeaders, PREVIEWABLE_MIME_TYPES } = await import(
          "./fileValidation"
        );

        const userId = req.user.claims.sub;
        const documentId = req.params.id;

        const document = await storage.getMedicalDocumentByOwner(
          documentId,
          userId,
        );

        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }

        // Validate fileData exists
        if (!document.fileData) {
          console.error(
            `AUDIT: File data not found for document ${documentId} - User: ${userId}`,
          );
          return res.status(500).json({ message: "File data not available" });
        }

        // LS-96-7: Enhanced type checking for previewable files
        if (!PREVIEWABLE_MIME_TYPES.includes(document.mimeType as any)) {
          console.warn(
            `AUDIT: Preview attempt for non-previewable file - User: ${userId}, Document: ${documentId}, Type: ${document.mimeType}`,
          );
          return res.status(400).json({ message: "File type not previewable" });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(document.fileData, "base64");

        // LS-96-7: Enhanced security headers for file previews
        const secureHeaders = getSecureFileHeaders(
          document.originalName,
          document.mimeType,
          true,
        );
        res.set({
          ...secureHeaders,
          "Content-Length": fileBuffer.length.toString(),
        });

        // LS-96-7: Audit logging for medical document previews (PHI-safe)
        console.log(
          `AUDIT: Medical document previewed - User: ${userId}, Document: ${documentId}, Type: ${document.mimeType}`,
        );

        res.send(fileBuffer);
      } catch (error) {
        console.error("Error previewing file:", error);
        res.status(500).json({ message: "Failed to preview file" });
      }
    },
  );

  // Confluence integration endpoint
  app.get("/api/confluence/content", async (req, res) => {
    try {
      const confluenceService = new ConfluenceService({
        baseUrl: process.env.CONFLUENCE_URL || "",
        email: process.env.CONFLUENCE_EMAIL || "",
        apiToken: process.env.CONFLUENCE_API_TOKEN || "",
      });

      const businessContent = await confluenceService.getBusinessPlanContent();

      // Real team data as provided - names only, no positions
      const teamMembers = [
        {
          id: "juan-fernandez",
          name: "Juan Fernandez",
          email: "juan.fernandez@evity.mx",
        },
        {
          id: "daniel-nader",
          name: "Daniel Nader",
          email: "daniel.nader@evity.mx",
        },
        {
          id: "sofia-moya",
          name: "Sofia Moya",
          email: "sofia.moya@evity.mx",
        },
        {
          id: "alfredo-cuellar",
          name: "Alfredo Cuellar",
          email: "alfredo.cuellar@evity.mx",
        },
        {
          id: "veronica-moreno",
          name: "Veronica Moreno",
          email: "veronica.moreno@evity.mx",
        },
        {
          id: "elena-villarreal",
          name: "Elena Villarreal",
          email: "elena.villarreal@evity.mx",
        },
      ];

      // Extract key information from the content - ONLY return safe, whitelisted fields
      let safeData = {
        companyName: "Evity",
        mission:
          "Transformar la forma en que las personas envejecen, proporcionando herramientas científicas y personalizadas para vivir vidas más largas, saludables y plenas.",
        vision:
          "Ofrecer una clinica y plataforma innovadora que combine diseño moderno, atención humanista y tecnología digital, con un enfoque en longevidad y salud integral. El paciente recibe un diagnóstico profundo, intervenciones seguras y personalizadas, así como un acompañamiento continuo tanto físico como digital.",
        valueProposition:
          "Descubre los secretos científicos de la longevidad. Herramientas personalizadas, recursos basados en evidencia y una comunidad dedicada a vivir más y mejor.",
        team: teamMembers,
      };

      // Add debug data only if explicitly enabled
      if (process.env.SHOW_CONFLUENCE_DEBUG === "true") {
        (safeData as any).availableSpaces = businessContent.allSpaces;
        (safeData as any).searchResults = businessContent.searchResults;
      }

      // Try to extract from Confluence, but only use it if it's valid content
      if (businessContent.businessPlan) {
        const businessInfo = confluenceService.extractKeyInfo(
          businessContent.businessPlan.content,
        );
        // Only use extracted info if it's meaningful (more than 10 characters and doesn't look like fragments)
        if (
          businessInfo.mission &&
          businessInfo.mission.length > 10 &&
          !businessInfo.mission.includes("$")
        ) {
          safeData.mission = businessInfo.mission;
        }
        if (
          businessInfo.vision &&
          businessInfo.vision.length > 10 &&
          !businessInfo.vision.includes("$")
        ) {
          safeData.vision = businessInfo.vision;
        }
        if (
          businessInfo.valueProposition &&
          businessInfo.valueProposition.length > 10 &&
          !businessInfo.valueProposition.includes("$")
        ) {
          safeData.valueProposition = businessInfo.valueProposition;
        }
      }

      if (businessContent.propuestaIntegral) {
        const propuestaInfo = confluenceService.extractKeyInfo(
          businessContent.propuestaIntegral.content,
        );
        // Only use propuesta content if current data is still default and new content is valid
        if (
          safeData.mission.includes("Transformar") &&
          propuestaInfo.mission &&
          propuestaInfo.mission.length > 10 &&
          !propuestaInfo.mission.includes("$")
        ) {
          safeData.mission = propuestaInfo.mission;
        }
        if (
          safeData.vision.includes("Ser la plataforma") &&
          propuestaInfo.vision &&
          propuestaInfo.vision.length > 10 &&
          !propuestaInfo.vision.includes("$")
        ) {
          safeData.vision = propuestaInfo.vision;
        }
        if (
          safeData.valueProposition.includes("Descubre") &&
          propuestaInfo.valueProposition &&
          propuestaInfo.valueProposition.length > 10 &&
          !propuestaInfo.valueProposition.includes("$")
        ) {
          safeData.valueProposition = propuestaInfo.valueProposition;
        }
      }

      res.json(safeData);
    } catch (error: any) {
      console.error("Error fetching Confluence content:", error);
      res.status(500).json({
        error: "Failed to fetch Confluence content",
        details: error?.message || error,
      });
    }
  });

  // Test endpoint to check connection
  app.get("/api/confluence/test", async (req, res) => {
    try {
      const confluenceService = new ConfluenceService({
        baseUrl: process.env.CONFLUENCE_URL || "",
        email: process.env.CONFLUENCE_EMAIL || "",
        apiToken: process.env.CONFLUENCE_API_TOKEN || "",
      });

      const spaces = await confluenceService.getAllSpaces();
      res.json({
        status: "Connected successfully",
        spacesFound: spaces.length,
        spaces: spaces.map((s) => ({ key: s.key, name: s.name })),
      });
    } catch (error: any) {
      console.error("Confluence connection test failed:", error);
      res.status(500).json({
        status: "Connection failed",
        error: error?.message || error,
      });
    }
  });

  // Helper function to validate Jira configuration
  const validateJiraConfig = () => {
    const host = process.env.JIRA_DOMAIN;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!host || !email || !apiToken) {
      throw new Error(
        "Jira configuration incomplete. Please set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.",
      );
    }

    if (!host.includes(".atlassian.net")) {
      throw new Error(
        "JIRA_DOMAIN must be in format: https://your-domain.atlassian.net",
      );
    }

    return { host, email, apiToken };
  };

  // Helper function to validate project key
  const validateProjectKey = (projectKey: string) => {
    if (!/^[A-Z][A-Z0-9]+$/.test(projectKey)) {
      throw new Error(
        "Invalid project key format. Must start with a letter and contain only uppercase letters and numbers.",
      );
    }
  };

  // Jira integration endpoints (debug mode only)
  app.get("/api/jira/test", async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "Jira integration is disabled" });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import("./jiraService")).JiraService(
        config,
      );

      const connectionTest = await jiraService.testConnection();
      res.json(connectionTest);
    } catch (error: any) {
      console.error("Jira connection test failed:", error);
      res.status(500).json({
        status: "Connection failed",
        error: error?.message || error,
      });
    }
  });

  app.get("/api/jira/projects", async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "Jira integration is disabled" });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import("./jiraService")).JiraService(
        config,
      );

      const projects = await jiraService.getProjects();
      res.json({ projects });
    } catch (error: any) {
      console.error("Error fetching Jira projects:", error);
      res.status(500).json({
        error: "Failed to fetch projects",
        details: error?.message || error,
      });
    }
  });

  app.get("/api/jira/issues/recent", async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "Jira integration is disabled" });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import("./jiraService")).JiraService(
        config,
      );

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const maxResults = Math.min(Math.max(limit, 1), 100); // Limit between 1-100

      const issues = await jiraService.getRecentIssues(maxResults);
      res.json({ issues });
    } catch (error: any) {
      console.error("Error fetching recent Jira issues:", error);
      res.status(500).json({
        error: "Failed to fetch recent issues",
        details: error?.message || error,
      });
    }
  });

  app.get("/api/jira/projects/:projectKey/issues", async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "Jira integration is disabled" });
      }

      const { projectKey } = req.params;

      try {
        validateProjectKey(projectKey);
      } catch (validationError: any) {
        return res.status(400).json({
          error: "Invalid project key",
          details: validationError.message,
        });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import("./jiraService")).JiraService(
        config,
      );

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const maxResults = Math.min(Math.max(limit, 1), 100); // Limit between 1-100

      const issues = await jiraService.getProjectIssues(projectKey, maxResults);
      res.json({ issues });
    } catch (error: any) {
      console.error(
        `Error fetching issues for project ${req.params.projectKey}:`,
        error,
      );
      res.status(500).json({
        error: "Failed to fetch project issues",
        details: error?.message || error,
      });
    }
  });

  // Jira specific issue endpoint
  app.get("/api/jira/issue/:issueKey", async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "Jira integration is disabled" });
      }

      const { issueKey } = req.params;

      const config = validateJiraConfig();
      const jiraService = new (await import("./jiraService")).JiraService(
        config,
      );

      const issue = await jiraService.getIssueByKey(issueKey);
      if (issue) {
        res.json({ issue });
      } else {
        res.status(404).json({ error: "Issue not found" });
      }
    } catch (error: any) {
      console.error(`Error fetching issue ${req.params.issueKey}:`, error);
      res.status(500).json({
        error: "Failed to fetch issue",
        details: error?.message || error,
      });
    }
  });

  app.get("/api/jira/projects/:projectKey/stats", async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "Jira integration is disabled" });
      }

      const { projectKey } = req.params;

      try {
        validateProjectKey(projectKey);
      } catch (validationError: any) {
        return res.status(400).json({
          error: "Invalid project key",
          details: validationError.message,
        });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import("./jiraService")).JiraService(
        config,
      );

      const stats = await jiraService.getProjectStats(projectKey);
      res.json(stats);
    } catch (error: any) {
      console.error(
        `Error fetching stats for project ${req.params.projectKey}:`,
        error,
      );
      res.status(500).json({
        error: "Failed to fetch project stats",
        details: error?.message || error,
      });
    }
  });

  // LS-110: Endpoint to mark Jira issues as completed
  app.post(
    "/api/jira/issue/:issueKey/complete",
    isAuthenticated,
    async (req, res) => {
      try {
        if (!process.env.SHOW_JIRA_DEBUG) {
          return res
            .status(404)
            .json({ error: "Jira integration is disabled" });
        }

        const { issueKey } = req.params;
        const { comment } = req.body;

        if (!issueKey) {
          return res.status(400).json({ error: "Issue key is required" });
        }

        const config = validateJiraConfig();
        const jiraService = new (await import("./jiraService")).JiraService(
          config,
        );

        // Mark issue as completed
        const result = await jiraService.markIssueAsCompleted(
          issueKey,
          comment ||
            `Marcado como completado por ${(req as any).user?.claims?.email || "usuario"} desde la aplicación Evity`,
        );

        if (result.success) {
          // Audit log the completion
          await AuditLogger.log({
            userId: (req as any).user?.claims?.id || "unknown",
            userEmail: (req as any).user?.claims?.email || "unknown",
            action: "ADMIN_ACCESS",
            resource: `jira_issue:${issueKey}`,
            details: {
              action: "issue_completion",
              issueKey,
              message: result.message,
            },
            outcome: "SUCCESS",
            riskLevel: "LOW",
          });

          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error: any) {
        console.error(
          `Error marking issue ${req.params.issueKey} as completed:`,
          error,
        );
        res.status(500).json({
          error: "Failed to mark issue as completed",
          details: error?.message || error,
        });
      }
    },
  );

  // CheckEnd - Automated acceptance criteria validation
  app.get("/api/check-end/:issueKey", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.SHOW_JIRA_DEBUG) {
        return res.status(404).json({ error: "CheckEnd feature is disabled" });
      }

      const { issueKey } = req.params;

      if (!issueKey) {
        return res.status(400).json({ error: "Issue key is required" });
      }

      console.log(
        `[CheckEnd] Starting validation for ${issueKey} by ${(req as any).user?.claims?.email}`,
      );

      const checkEndService = new CheckEndService();
      const result = await checkEndService.executeCheckEnd(issueKey);

      // Audit log the CheckEnd execution
      await AuditLogger.log({
        userId: (req as any).user?.claims?.id || "unknown",
        userEmail: (req as any).user?.claims?.email || "unknown",
        action: "ADMIN_ACCESS",
        resource: `check_end:${issueKey}`,
        details: {
          action: "check_end_validation",
          issueKey,
          criteriaCount: result.criteriaCount,
          passedCount: result.passedCount,
          overallStatus: result.overallStatus,
        },
        outcome: "SUCCESS",
        riskLevel: "LOW",
      });

      res.json({
        success: true,
        checkEndResult: result,
      });
    } catch (error: any) {
      console.error(
        `[CheckEnd] Error validating ${req.params.issueKey}:`,
        error,
      );
      res.status(500).json({
        success: false,
        error: "CheckEnd validation failed",
        details: error?.message || error,
      });
    }
  });

  // Admin document download/preview endpoints
  app.get(
    "/api/admin/documents/:id/download",
    isAdmin,
    downloadRateLimit,
    async (req: any, res) => {
      try {
        // Import security utilities
        const { getSecureFileHeaders } = await import("./fileValidation");

        const documentId = req.params.id;
        console.log(
          `ADMIN ACCESS: Admin ${req.user.claims.email} downloading document ${documentId}`,
        );

        // Admin can access any document - get document directly by ID
        const document = await storage.getMedicalDocumentById(documentId);

        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }

        // Validate fileData exists
        if (!document.fileData) {
          console.error(
            `AUDIT: File data not found for document ${documentId} - Admin: ${req.user.claims.email}`,
          );
          return res.status(500).json({ message: "File data not available" });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(document.fileData, "base64");

        // Enhanced security headers for file downloads
        const secureHeaders = getSecureFileHeaders(
          document.originalName,
          document.mimeType,
          false,
        );
        res.set({
          ...secureHeaders,
          "Content-Length": fileBuffer.length.toString(),
        });

        // Audit logging for admin document downloads
        console.log(
          `AUDIT: Admin document download - Admin: ${req.user.claims.email}, Document: ${documentId}, Size: ${fileBuffer.length}`,
        );

        res.send(fileBuffer);
      } catch (error) {
        console.error("Error downloading admin file:", error);
        res.status(500).json({ message: "Failed to download file" });
      }
    },
  );

  app.get(
    "/api/admin/documents/:id/preview",
    isAdmin,
    previewRateLimit,
    async (req: any, res) => {
      try {
        // Import security utilities
        const { getSecureFileHeaders, PREVIEWABLE_MIME_TYPES } = await import(
          "./fileValidation"
        );

        const documentId = req.params.id;
        console.log(
          `ADMIN ACCESS: Admin ${req.user.claims.email} previewing document ${documentId}`,
        );

        // Admin can access any document - get document directly by ID
        const document = await storage.getMedicalDocumentById(documentId);

        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }

        // Validate fileData exists
        if (!document.fileData) {
          console.error(
            `AUDIT: File data not found for document ${documentId} - Admin: ${req.user.claims.email}`,
          );
          return res.status(500).json({ message: "File data not available" });
        }

        // Check if file type can be previewed
        if (!PREVIEWABLE_MIME_TYPES.includes(document.mimeType as any)) {
          return res
            .status(400)
            .json({ message: "File type cannot be previewed" });
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(document.fileData, "base64");

        // Enhanced security headers for inline preview
        const secureHeaders = getSecureFileHeaders(
          document.originalName,
          document.mimeType,
          true,
        );
        res.set({
          ...secureHeaders,
          "Content-Length": fileBuffer.length.toString(),
        });

        // Audit logging for admin document previews
        console.log(
          `AUDIT: Admin document preview - Admin: ${req.user.claims.email}, Document: ${documentId}, Size: ${fileBuffer.length}`,
        );

        res.send(fileBuffer);
      } catch (error) {
        console.error("Error previewing admin file:", error);
        res.status(500).json({ message: "Failed to preview file" });
      }
    },
  );

  // Admin routes for monitoring users and files (SECURED)
  app.get("/api/admin/users", isAdmin, async (req: any, res) => {
    try {
      // Basic admin check - you can enhance this with proper RBAC
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // For now, allow any authenticated user - you should implement proper admin role check
      console.log(
        `ADMIN ACCESS: User ${user?.email} accessed /api/admin/users`,
      );

      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/documents", isAdmin, async (req: any, res) => {
    try {
      // Basic admin check - you can enhance this with proper RBAC
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      console.log(
        `ADMIN ACCESS: User ${user?.email} accessed /api/admin/documents`,
      );

      const documents = await storage.getAllMedicalDocuments();
      res.json({ documents });
    } catch (error) {
      console.error("Error fetching admin documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (req: any, res) => {
    try {
      // Basic admin check - you can enhance this with proper RBAC
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      console.log(
        `ADMIN ACCESS: User ${user?.email} accessed /api/admin/stats`,
      );

      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // User's own questionnaire results (latest)
  app.get(
    "/api/questionnaire-results/latest",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const results = await storage.getUserQuestionnaireResults(userId);

        if (results.length === 0) {
          return res.json({ result: null });
        }

        // Return the most recent result (already ordered by completedAt DESC)
        res.json({ result: results[0] });
      } catch (error) {
        console.error("Error fetching latest questionnaire result:", error);
        res
          .status(500)
          .json({ message: "Error al obtener resultados del cuestionario" });
      }
    },
  );

  // User's questionnaire history
  app.get(
    "/api/questionnaire-results/history",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const results = await storage.getUserQuestionnaireResults(userId);
        res.json({ results });
      } catch (error) {
        console.error("Error fetching questionnaire history:", error);
        res
          .status(500)
          .json({ message: "Error al obtener historial de cuestionarios" });
      }
    },
  );

  app.get(
    "/api/admin/questionnaire-results",
    isAdmin,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);

        console.log(
          `ADMIN ACCESS: User ${user?.email} accessed /api/admin/questionnaire-results`,
        );

        const results = await storage.getAllQuestionnaireResults();
        res.json({ results });
      } catch (error) {
        console.error("Error fetching questionnaire results:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch questionnaire results" });
      }
    },
  );

  // LS-108: Security audit logs endpoint for administrators
  app.get(
    "/api/admin/audit-logs",
    isAdmin,
    securityAdminRateLimit.middleware,
    async (req: any, res) => {
      try {
        await AuditLogger.logAdminAccess(req, "audit-logs");

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
        const action = req.query.action as string;
        const riskLevel = req.query.riskLevel as string;
        const userId = req.query.userId as string;

        const auditLogs = await storage.getAuditLogs({
          page,
          limit,
          action,
          riskLevel,
          userId,
        });

        res.json({
          success: true,
          ...auditLogs,
        });
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        await AuditLogger.logFromRequest(req, "ADMIN_ACCESS", "ERROR", {
          resource: "audit-logs",
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        res.status(500).json({
          success: false,
          message: "Error interno del servidor",
        });
      }
    },
  );

  // LS-104: Contact form endpoint for email sending
  app.post("/api/contacto", async (req, res) => {
    try {
      const { nombre, email, asunto, mensaje } = req.body;

      // Basic validation
      if (!nombre || !email || !asunto || !mensaje) {
        return res.status(400).json({
          message: "Todos los campos son requeridos",
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "El email no tiene un formato válido",
        });
      }

      // Import nodemailer dynamically
      const nodemailer = await import("nodemailer");

      // Create SMTP transporter using environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify SMTP connection configuration
      await transporter.verify();

      // Send email to Evity team
      const mailOptions = {
        from: `"${nombre}" <${process.env.SMTP_USER}>`, // sender address
        to: "contacto@evity.mx", // Evity contact email
        replyTo: email, // reply to user's email
        subject: `Contacto Evity: ${asunto}`,
        html: `
          <h2>Nuevo mensaje de contacto - Evity</h2>
          <div style="border-left: 4px solid #0066cc; padding-left: 20px; margin: 20px 0;">
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Asunto:</strong> ${asunto}</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Mensaje:</h3>
            <p style="white-space: pre-wrap;">${mensaje}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de contacto de Evity.
            <br>
            Para responder, contesta directamente a este email.
          </p>
        `,
      };

      // Send auto-reply to user
      const autoReplyOptions = {
        from: `"Evity - Longevidad y Bienestar" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Gracias por contactar a Evity - Hemos recibido tu mensaje",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center;">
              <h1>Evity</h1>
              <p>Longevidad y Bienestar</p>
            </div>
            <div style="padding: 30px;">
              <h2>¡Hola ${nombre}!</h2>
              <p>Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo te responderá en menos de 24 horas.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Resumen de tu mensaje:</h3>
                <p><strong>Asunto:</strong> ${asunto}</p>
                <p style="color: #666; font-size: 14px;">Si necesitas realizar algún cambio, envía un nuevo mensaje.</p>
              </div>
              
              <p>Mientras tanto, te invitamos a:</p>
              <ul>
                <li>Explorar nuestros <a href="${req.protocol}://${req.get("host")}/recursos" style="color: #0066cc;">recursos sobre longevidad</a></li>
                <li>Leer nuestro <a href="${req.protocol}://${req.get("host")}/blog" style="color: #0066cc;">blog especializado</a></li>
                <li>Conocer más sobre <a href="${req.protocol}://${req.get("host")}/" style="color: #0066cc;">nuestra misión</a></li>
              </ul>
              
              <p>¡Esperamos ayudarte en tu camino hacia una vida más larga y saludable!</p>
              
              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 30px;">
                <p style="margin: 0; color: #0066cc; font-weight: bold;">
                  💡 ¿Sabías que pequeños cambios en tu estilo de vida pueden agregar años saludables a tu vida?
                </p>
              </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Evity. Transformando la forma en que envejecemos.</p>
              <p>Este es un mensaje automático, por favor no respondas a este email.</p>
            </div>
          </div>
        `,
      };

      // Send both emails
      await Promise.all([
        transporter.sendMail(mailOptions),
        transporter.sendMail(autoReplyOptions),
      ]);

      // LS-104: Audit log for contact form submissions
      console.log(
        `AUDIT: Contact form submitted - Name: ${nombre}, Email: ${email}, Subject: ${asunto}`,
      );

      res.json({
        success: true,
        message: "Mensaje enviado correctamente",
      });
    } catch (error: any) {
      console.error("Error sending contact email:", error);

      // Don't expose internal errors to client
      const errorMessage =
        error.code === "EAUTH"
          ? "Error de configuración del servidor de email"
          : "Error interno del servidor al enviar el mensaje";

      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  });

  // Medical Questionnaire endpoints
  app.get("/api/questionnaire", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionnaire = await storage.getUserQuestionnaire(userId);

      if (!questionnaire) {
        return res.json({
          exists: false,
          questionnaire: null,
        });
      }

      res.json({
        exists: true,
        questionnaire,
      });
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      res.status(500).json({ message: "Error al obtener el cuestionario" });
    }
  });

  app.post("/api/questionnaire", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const existingQuestionnaire = await storage.getUserQuestionnaire(userId);

      if (existingQuestionnaire) {
        const validatedData = updateQuestionnaireSchema.parse(req.body);
        let updated = await storage.updateQuestionnaire(userId, validatedData);

        if (validatedData.isCompleted === "true") {
          await storage.markQuestionnaireComplete(userId);
          const refreshed = await storage.getUserQuestionnaire(userId);
          if (refreshed) {
            updated = refreshed;

            // Save the completed questionnaire result to history
            // IMPORTANT: Accept both numbers and numeric strings since DB stores as varchar
            const hasValidLongevityPoints =
              refreshed.longevityPoints !== undefined &&
              refreshed.longevityPoints !== null &&
              refreshed.longevityPoints !== "";
            const hasValidHealthStatus =
              refreshed.healthStatus !== undefined &&
              refreshed.healthStatus !== null &&
              refreshed.healthStatus !== "";

            console.log("[POST] Validation check before saving:", {
              hasValidLongevityPoints,
              hasValidHealthStatus,
              longevityPointsValue: refreshed.longevityPoints,
              healthStatusValue: refreshed.healthStatus,
            });

            if (hasValidLongevityPoints && hasValidHealthStatus) {
              try {
                console.log("[POST] ✅ SAVING questionnaire result to history");

                // CRITICAL FIX: Convert longevityPoints to string because DB column is varchar
                await storage.saveQuestionnaireResult({
                  userId: userId,
                  answers: refreshed.answers as Record<string, string | number>,
                  longevityPoints: String(refreshed.longevityPoints),
                  healthStatus: String(refreshed.healthStatus),
                  sectionScores: refreshed.sectionScores,
                  sectionInterpretations: refreshed.sectionInterpretations,
                });

                console.log(
                  "[POST] ✅ SUCCESS: Questionnaire saved to questionnaire_results table",
                );
              } catch (saveError: any) {
                console.error(
                  "[POST] ❌ CRITICAL: Failed to save questionnaire result:",
                  {
                    message: saveError.message,
                    userId,
                    longevityPoints: refreshed.longevityPoints,
                    healthStatus: refreshed.healthStatus,
                  },
                );
              }
            } else {
              console.error("[POST] ❌ GUARD FAILED - NOT saving:", {
                hasValidLongevityPoints,
                hasValidHealthStatus,
                longevityPoints: refreshed.longevityPoints,
                healthStatus: refreshed.healthStatus,
              });
            }
          }
        }

        return res.json(updated);
      }

      const validatedData = insertQuestionnaireSchema.parse({
        userId,
        ...req.body,
      });

      const questionnaire = await storage.createQuestionnaire(validatedData);
      res.json(questionnaire);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating/updating questionnaire:", error);
      res.status(500).json({ message: "Error al guardar el cuestionario" });
    }
  });

  app.delete("/api/questionnaire", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteQuestionnaire(userId);
      res.json({ success: true, message: "Cuestionario eliminado" });
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      res.status(500).json({ message: "Error al eliminar el cuestionario" });
    }
  });

  app.put("/api/questionnaire", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const validatedData = updateQuestionnaireSchema.parse(req.body);
      const existingQuestionnaire = await storage.getUserQuestionnaire(userId);

      if (!existingQuestionnaire) {
        return res.status(404).json({ message: "Cuestionario no encontrado" });
      }

      console.log("[DEBUG] validatedData received:", {
        isCompleted: validatedData.isCompleted,
        hasLongevityPoints: !!validatedData.longevityPoints,
        hasHealthStatus: !!validatedData.healthStatus,
        hasSectionScores: !!validatedData.sectionScores,
        hasSectionInterpretations: !!validatedData.sectionInterpretations,
      });

      let updated = await storage.updateQuestionnaire(userId, validatedData);

      console.log("[DEBUG] after updateQuestionnaire:", {
        hasLongevityPoints: !!updated.longevityPoints,
        hasHealthStatus: !!updated.healthStatus,
        hasSectionScores: !!updated.sectionScores,
        hasSectionInterpretations: !!updated.sectionInterpretations,
      });

      if (validatedData.isCompleted === "true") {
        await storage.markQuestionnaireComplete(userId);
        const refreshed = await storage.getUserQuestionnaire(userId);

        console.log("[DEBUG] after markComplete and refresh:", {
          hasRefreshed: !!refreshed,
          hasLongevityPoints: !!refreshed?.longevityPoints,
          hasHealthStatus: !!refreshed?.healthStatus,
          hasSectionScores: !!refreshed?.sectionScores,
          hasSectionInterpretations: !!refreshed?.sectionInterpretations,
        });

        if (refreshed) {
          updated = refreshed;

          // Save the completed questionnaire result to history
          // IMPORTANT: Accept both numbers and numeric strings since DB stores as varchar
          const hasValidLongevityPoints =
            refreshed.longevityPoints !== undefined &&
            refreshed.longevityPoints !== null &&
            refreshed.longevityPoints !== "";
          const hasValidHealthStatus =
            refreshed.healthStatus !== undefined &&
            refreshed.healthStatus !== null &&
            refreshed.healthStatus !== "";

          console.log("[DEBUG] Validation check before saving:", {
            hasValidLongevityPoints,
            hasValidHealthStatus,
            longevityPointsValue: refreshed.longevityPoints,
            longevityPointsType: typeof refreshed.longevityPoints,
            healthStatusValue: refreshed.healthStatus,
            healthStatusType: typeof refreshed.healthStatus,
          });

          if (hasValidLongevityPoints && hasValidHealthStatus) {
            try {
              console.log(
                "[DEBUG] ✅ PROCEEDING TO SAVE questionnaire result to history",
              );
              console.log("[DEBUG] Data to save:", {
                userId,
                hasAnswers: !!refreshed.answers,
                longevityPoints: refreshed.longevityPoints,
                healthStatus: refreshed.healthStatus,
                hasSectionScores: !!refreshed.sectionScores,
                hasSectionInterpretations: !!refreshed.sectionInterpretations,
              });

              // CRITICAL FIX: Convert longevityPoints to string because DB column is varchar
              await storage.saveQuestionnaireResult({
                userId: userId,
                answers: refreshed.answers as Record<string, string | number>,
                longevityPoints: String(refreshed.longevityPoints),
                healthStatus: String(refreshed.healthStatus),
                sectionScores: refreshed.sectionScores,
                sectionInterpretations: refreshed.sectionInterpretations,
              });

              console.log(
                "[DEBUG] ✅ SUCCESS: Questionnaire result saved to questionnaire_results table",
              );
            } catch (saveError: any) {
              console.error(
                "[ERROR] ❌ CRITICAL: Failed to save questionnaire result to history table:",
                {
                  message: saveError.message,
                  stack: saveError.stack,
                  code: saveError.code,
                  data: {
                    userId,
                    longevityPoints: refreshed.longevityPoints,
                    healthStatus: refreshed.healthStatus,
                  },
                },
              );
              // Don't throw - let the response continue even if history save fails
            }
          } else {
            console.error(
              "[ERROR] ❌ NOT saving questionnaire result - GUARD FAILED:",
              {
                hasValidLongevityPoints,
                hasValidHealthStatus,
                longevityPoints: refreshed.longevityPoints,
                longevityPointsType: typeof refreshed.longevityPoints,
                healthStatus: refreshed.healthStatus,
                healthStatusType: typeof refreshed.healthStatus,
              },
            );
          }
        }
      }

      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error updating questionnaire:", error);
      res.status(500).json({ message: "Error al actualizar el cuestionario" });
    }
  });

  // AI Agent - Create conversation session
  app.post("/api/ai-agent/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = generateConversationId();

      const session: ConversationSession = {
        conversationId,
        userId,
        history: [],
        hasSentPersonalGreeting: false,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      conversationStore.set(conversationId, session);

      res.json({ conversationId });
    } catch (error: any) {
      console.error("Error creating conversation session:", error);
      res
        .status(500)
        .json({ message: "Error al crear la sesión de conversación" });
    }
  });

  // AI Agent endpoint - proxies requests to Python service
  app.post("/api/ai-agent/ask", isAuthenticated, async (req: any, res) => {
    try {
      const { question, conversationId } = req.body;

      if (!question || !question.trim()) {
        return res
          .status(400)
          .json({ message: "La pregunta no puede estar vacía" });
      }

      const userId = req.user.claims.sub;
      const userName = req.user?.firstName || null;

      // Get or create conversation session
      let session = conversationId
        ? conversationStore.get(conversationId)
        : null;

      // If no session exists or session doesn't belong to user, create new one
      if (!session || session.userId !== userId) {
        const newConversationId = generateConversationId();
        session = {
          conversationId: newConversationId,
          userId,
          history: [],
          hasSentPersonalGreeting: false,
          createdAt: new Date(),
          lastActivityAt: new Date(),
        };
        conversationStore.set(newConversationId, session);
      }

      // Detect if current message contains greeting
      const messageHasGreeting = containsGreeting(question);

      // Update last activity
      session.lastActivityAt = new Date();

      // Call Python API service with conversation history
      const pythonApiPort = process.env.PYTHON_API_PORT || 5001;
      const pythonApiUrl = `http://localhost:${pythonApiPort}/ask`;

      const response = await fetch(pythonApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          userName: userName,
          history: session.history,
          hasSentPersonalGreeting: session.hasSentPersonalGreeting,
          messageHasGreeting: messageHasGreeting,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Python API error:", errorData);

        if (response.status === 404) {
          return res.status(503).json({
            message:
              "El agente aún no tiene documentos indexados. Por favor, agrega documentos a la carpeta 'python_agent/contenidos'.",
            error: errorData.error,
          });
        }

        return res.status(503).json({
          message: "El servicio de IA no está disponible en este momento",
          error: errorData.error,
        });
      }

      const data = await response.json();

      // Update conversation history
      session.history.push({
        role: "user",
        content: question.trim(),
        containsGreeting: messageHasGreeting,
      });

      session.history.push({
        role: "assistant",
        content: data.answer,
        containsGreeting: false,
      });

      // Update greeting flag if we sent a personalized greeting
      if (messageHasGreeting && userName) {
        session.hasSentPersonalGreeting = true;
      }

      // Keep only last 20 messages to prevent memory bloat
      if (session.history.length > 20) {
        session.history = session.history.slice(-20);
      }

      // Log AI interaction for audit
      await AuditLogger.log({
        userId: req.user.claims.sub,
        userEmail: req.user.claims.email || "unknown",
        action: "AI_AGENT_QUERY",
        resource: "AI Agent",
        details: { question: question.substring(0, 100) },
        outcome: "SUCCESS",
        riskLevel: "LOW",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        sessionId: req.sessionID,
      });

      res.json({
        answer: data.answer,
        question: data.question,
        conversationId: session.conversationId,
      });
    } catch (error: any) {
      console.error("Error calling AI agent:", error);

      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          message:
            "El servicio de IA no está iniciado. Por favor, contacta al administrador.",
          error: "Service unavailable",
        });
      }

      res.status(500).json({
        message: "Error al procesar tu pregunta",
        error: error.message,
      });
    }
  });

  // AI Agent - Generate personalized summary based on questionnaire answers
  app.post(
    "/api/ai-agent/generate-summary",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { answers } = req.body;
        const userId = req.user.claims.sub;

        if (!answers || typeof answers !== "object") {
          return res
            .status(400)
            .json({
              message: "Las respuestas del cuestionario son requeridas",
            });
        }

        // Initialize OpenAI client
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Format answers for the prompt
        const answersText = Object.entries(answers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");

        // Call OpenAI with the personalized prompt
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente de salud especializado en longevidad. Tu tarea es generar retroalimentaciones personalizadas basadas en las respuestas del cuestionario de salud de los usuarios.",
            },
            {
              role: "user",
              content: `Genera una retroalimentación personalizada en un solo párrafo, cálido y claro, basada en las 29 respuestas del usuario. Inicia con una frase breve y reflexiva que hable de cómo tú pareces relacionarte contigo mismo y con tu bienestar desde una mirada humana y empática. Después de esa apertura, integra de manera fluida una explicación técnica y accesible sobre lo que tus hábitos muestran en áreas como tu condición física, tu alimentación, tu sueño, tu manejo emocional, tu energía y tus factores de riesgo o protección. Usa lenguaje amable, explicativo y fácil de entender, evitando tecnicismos innecesarios y sin mencionar frases como "según tus respuestas". Habla siempre en segunda persona para generar cercanía. La descripción debe sentirse como una lectura de quién eres, no como un resumen del cuestionario, aunque esté completamente basada en la información que proporcionaste en él. El párrafo debe sentirse natural, personalizado y orientado a ayudarte a comprender mejor tu propio funcionamiento y bienestar.

Respuestas del usuario:
${answersText}`,
            },
          ],
          temperature: 0.7,
        });

        const personalizedSummary = completion.choices[0].message.content || "";

        // Save the personalized summary to the most recent questionnaire result
        try {
          await storage.updateLatestQuestionnaireResult(userId, {
            personalizedSummary,
          });
        } catch (dbError) {
          console.error(
            "Error saving personalized summary to database:",
            dbError,
          );
          // Don't fail the request if database update fails
        }

        // Log the generation for audit
        await AuditLogger.log({
          userId: req.user.claims.sub,
          userEmail: req.user.claims.email || "unknown",
          action: "AI_SUMMARY_GENERATION",
          resource: "Questionnaire Summary",
          details: { answerCount: Object.keys(answers).length },
          outcome: "SUCCESS",
          riskLevel: "LOW",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          sessionId: req.sessionID,
        });

        res.json({ personalizedSummary });
      } catch (error: any) {
        console.error("Error generating personalized summary:", error);
        res.status(500).json({
          message: "Error al generar el resumen personalizado",
          error: error.message,
        });
      }
    },
  );

  const httpServer = createServer(app);

  return httpServer;
}
