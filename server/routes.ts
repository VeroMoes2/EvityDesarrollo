import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { ConfluenceService } from "./confluenceService";
import { setupAuth, isAuthenticated, isAdmin } from "./localAuth";
import { uploadRateLimit, downloadRateLimit, previewRateLimit } from "./rateLimiter";
import { updateUserProfileSchema } from "@shared/schema";
// LS-108: Enhanced security middleware
import { 
  securityHeaders, 
  inputSanitization,
  csrfProtection,
  loginRateLimit as securityLoginRateLimit,
  adminRateLimit as securityAdminRateLimit
} from "./securityMiddleware";
import AuditLogger from "./auditLogger";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // LS-96-7: Aligned with fileValidation.ts ALLOWED_MIME_TYPES
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Return structured error for consistent JSON handling
      cb(new Error(`MULTER_INVALID_TYPE:${file.mimetype}`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // LS-108: Apply security headers to all routes
  app.use(securityHeaders);
  
  // LS-108: Input sanitization for all requests
  app.use(inputSanitization);
  
  // Auth middleware (handles CSRF individually)
  await setupAuth(app);
  
  // LS-108: CSRF protection for protected routes (not auth routes)
  app.use('/api', (req, res, next) => {
    // Skip CSRF for auth endpoints and GET requests
    if (req.path === '/login' || req.path === '/logout' || req.path === '/register' || req.method === 'GET') {
      return next();
    }
    return csrfProtection(req, res, next);
  });
  
  // LS-108: CSRF protection applied selectively (not to auth routes)
  // Auth routes handle CSRF individually to avoid token bootstrap issues

  // LS-108: CSRF token endpoint for frontend
  // LS-108: CSRF token endpoint with explicit protection to generate token
  app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: res.locals.csrfToken });
  });

  // Auth routes - handled by localAuth.ts now
  // The /api/auth/user endpoint is now handled in localAuth.ts

  // LS-96: Medical documents endpoints for user profile system
  // LS-102: Enhanced endpoint with pagination and search for medical documents listing
  app.get('/api/profile/medical-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Parse query parameters for pagination and search
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      
      // Use paginated method for better performance and UX
      const result = await storage.getUserMedicalDocumentsPaginated(userId, {
        page,
        limit,
        search: search.trim() || undefined
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching medical documents:", error);
      res.status(500).json({ message: "Error al obtener los archivos médicos" });
    }
  });

  app.post('/api/profile/medical-documents', isAuthenticated, async (req: any, res) => {
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
          errors: validationResult.error.issues 
        });
      }
      
      const document = await storage.createMedicalDocument(validationResult.data);
      res.json({ document });
    } catch (error) {
      console.error("Error creating medical document:", error);
      res.status(500).json({ message: "Failed to create medical document" });
    }
  });

  app.delete('/api/profile/medical-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Security: Check ownership before deletion
      const deletedCount = await storage.deleteMedicalDocumentByOwner(userId, id);
      
      if (deletedCount === 0) {
        return res.status(404).json({ message: "Document not found or access denied" });
      }
      
      // LS-96-7: Audit logging for medical document deletions
      console.log(`AUDIT: Medical document deleted - User: ${userId}, Document: ${id}`);
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting medical document:", error);
      res.status(500).json({ message: "Failed to delete medical document" });
    }
  });

  // LS-101: Update user profile endpoint
  app.patch('/api/profile/update', isAuthenticated, async (req: any, res) => {
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
          errors: validationResult.error.issues 
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
            field: "email"
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
      const { password, passwordResetToken, passwordResetExpires, emailVerificationToken, emailVerificationExpires, ...userResponse } = updatedUser;

      res.json({ 
        message: "Perfil actualizado exitosamente",
        user: userResponse,
        emailChanged: emailChanged
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      
      // Handle database unique constraint errors (email already exists)
      if (error.code === '23505' && error.detail?.includes('email')) {
        return res.status(400).json({ 
          field: "email",
          message: "Este email ya está registrado" 
        });
      }
      
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // File upload endpoint with enhanced security validations and multer error handling
  app.post('/api/profile/medical-documents/upload', isAuthenticated, uploadRateLimit, (req: any, res: any, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        // LS-96-7: Handle multer errors with consistent JSON response
        if (err.message.startsWith('MULTER_INVALID_TYPE:')) {
          const mimeType = err.message.split(':')[1];
          return res.status(400).json({
            message: `Tipo de archivo '${mimeType}' no permitido para documentos médicos`,
            type: "VALIDATION_ERROR"
          });
        } else if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: "El archivo excede el límite de 10MB",
            type: "VALIDATION_ERROR"
          });
        } else {
          return res.status(400).json({
            message: "Error en la carga del archivo",
            type: "UPLOAD_ERROR"
          });
        }
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      // Import validation schema and security utilities
      const { insertMedicalDocumentSchema } = await import("@shared/schema");
      const { validateMedicalFile, sanitizeFileData } = await import("./fileValidation");
      
      const userId = req.user.claims.sub;
      const file = req.file;
      const { fileType, originalName } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // LS-96-7: Enhanced file validation with magic number verification
      const validationResult = validateMedicalFile(file);
      
      if (!validationResult.isValid) {
        console.warn(`File validation failed for user ${userId}: ${validationResult.error}`);
        return res.status(400).json({ 
          message: validationResult.error,
          type: "VALIDATION_ERROR"
        });
      }

      // Log security warnings if any
      if (validationResult.securityWarnings) {
        console.warn(`Security warnings for upload from user ${userId}:`, validationResult.securityWarnings);
      }

      // Sanitize file data for secure storage
      const sanitizedFileData = sanitizeFileData(file.buffer);

      // Create document record with validated file data
      const documentData = {
        userId,
        fileType,
        originalName: originalName || file.originalname,
        filename: `${Date.now()}_${file.originalname}`,
        fileSize: file.size.toString(),
        mimeType: file.mimetype,
        fileData: sanitizedFileData,
      };

      // Validate document data with schema
      const schemaValidationResult = insertMedicalDocumentSchema.safeParse(documentData);
      
      if (!schemaValidationResult.success) {
        return res.status(400).json({ 
          message: "Invalid file data", 
          errors: schemaValidationResult.error.issues,
          type: "SCHEMA_VALIDATION_ERROR"
        });
      }

      const document = await storage.createMedicalDocument(schemaValidationResult.data);
      
      // LS-96-7: Enhanced audit logging for medical document uploads (PHI-safe)
      console.log(`AUDIT: Medical document uploaded - User: ${userId}, Document: ${document.id}, Type: ${fileType}, Size: ${file.size}`);
      
      res.json({ 
        message: "File uploaded successfully",
        document: {
          id: document.id,
          originalName: document.originalName,
          fileSize: document.fileSize,
          uploadedAt: document.uploadedAt
        },
        securityInfo: validationResult.securityWarnings ? {
          warnings: validationResult.securityWarnings
        } : undefined
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // File download endpoint with enhanced security
  app.get('/api/profile/medical-documents/:id/download', isAuthenticated, downloadRateLimit, async (req: any, res) => {
    try {
      // Import security utilities
      const { getSecureFileHeaders } = await import("./fileValidation");
      
      const userId = req.user.claims.sub;
      const documentId = req.params.id;

      const document = await storage.getMedicalDocumentByOwner(documentId, userId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Validate fileData exists
      if (!document.fileData) {
        console.error(`AUDIT: File data not found for document ${documentId} - User: ${userId}`);
        return res.status(500).json({ message: "File data not available" });
      }

      // Decode base64 file data
      const fileBuffer = Buffer.from(document.fileData, 'base64');
      
      // LS-96-7: Enhanced security headers for file downloads
      const secureHeaders = getSecureFileHeaders(document.originalName, document.mimeType, false);
      res.set({
        ...secureHeaders,
        'Content-Length': fileBuffer.length.toString(),
      });

      // LS-96-7: Audit logging for medical document downloads (PHI-safe)
      console.log(`AUDIT: Medical document downloaded - User: ${userId}, Document: ${documentId}, Size: ${fileBuffer.length}`);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // File preview endpoint with enhanced security (inline display)
  app.get('/api/profile/medical-documents/:id/preview', isAuthenticated, previewRateLimit, async (req: any, res) => {
    try {
      // Import security utilities
      const { getSecureFileHeaders, PREVIEWABLE_MIME_TYPES } = await import("./fileValidation");
      
      const userId = req.user.claims.sub;
      const documentId = req.params.id;

      const document = await storage.getMedicalDocumentByOwner(documentId, userId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Validate fileData exists
      if (!document.fileData) {
        console.error(`AUDIT: File data not found for document ${documentId} - User: ${userId}`);
        return res.status(500).json({ message: "File data not available" });
      }

      // LS-96-7: Enhanced type checking for previewable files
      if (!PREVIEWABLE_MIME_TYPES.includes(document.mimeType as any)) {
        console.warn(`AUDIT: Preview attempt for non-previewable file - User: ${userId}, Document: ${documentId}, Type: ${document.mimeType}`);
        return res.status(400).json({ message: "File type not previewable" });
      }

      // Decode base64 file data
      const fileBuffer = Buffer.from(document.fileData, 'base64');
      
      // LS-96-7: Enhanced security headers for file previews
      const secureHeaders = getSecureFileHeaders(document.originalName, document.mimeType, true);
      res.set({
        ...secureHeaders,
        'Content-Length': fileBuffer.length.toString(),
      });

      // LS-96-7: Audit logging for medical document previews (PHI-safe)
      console.log(`AUDIT: Medical document previewed - User: ${userId}, Document: ${documentId}, Type: ${document.mimeType}`);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error previewing file:", error);
      res.status(500).json({ message: "Failed to preview file" });
    }
  });

  // Confluence integration endpoint
  app.get('/api/confluence/content', async (req, res) => {
    try {
      const confluenceService = new ConfluenceService({
        baseUrl: process.env.CONFLUENCE_URL || '',
        email: process.env.CONFLUENCE_EMAIL || '',
        apiToken: process.env.CONFLUENCE_API_TOKEN || ''
      });

      const businessContent = await confluenceService.getBusinessPlanContent();
      
      // Real team data as provided - names only, no positions
      const teamMembers = [
        {
          id: 'juan-fernandez',
          name: 'Juan Fernandez',
          email: 'juan.fernandez@evity.mx'
        },
        {
          id: 'daniel-nader',
          name: 'Daniel Nader',
          email: 'daniel.nader@evity.mx'
        },
        {
          id: 'sofia-moya',
          name: 'Sofia Moya',
          email: 'sofia.moya@evity.mx'
        },
        {
          id: 'alfredo-cuellar',
          name: 'Alfredo Cuellar',
          email: 'alfredo.cuellar@evity.mx'
        },
        {
          id: 'veronica-moreno',
          name: 'Veronica Moreno',
          email: 'veronica.moreno@evity.mx'
        },
        {
          id: 'elena-villarreal',
          name: 'Elena Villarreal',
          email: 'elena.villarreal@evity.mx'
        }
      ];

      // Extract key information from the content - ONLY return safe, whitelisted fields
      let safeData = {
        companyName: 'Evity',
        mission: 'Transformar la forma en que las personas envejecen, proporcionando herramientas científicas y personalizadas para vivir vidas más largas, saludables y plenas.',
        vision: 'Ofrecer una clinica y plataforma innovadora que combine diseño moderno, atención humanista y tecnología digital, con un enfoque en longevidad y salud integral. El paciente recibe un diagnóstico profundo, intervenciones seguras y personalizadas, así como un acompañamiento continuo tanto físico como digital.',
        valueProposition: 'Descubre los secretos científicos de la longevidad. Herramientas personalizadas, recursos basados en evidencia y una comunidad dedicada a vivir más y mejor.',
        team: teamMembers
      };

      // Add debug data only if explicitly enabled
      if (process.env.SHOW_CONFLUENCE_DEBUG === 'true') {
        (safeData as any).availableSpaces = businessContent.allSpaces;
        (safeData as any).searchResults = businessContent.searchResults;
      }

      // Try to extract from Confluence, but only use it if it's valid content
      if (businessContent.businessPlan) {
        const businessInfo = confluenceService.extractKeyInfo(businessContent.businessPlan.content);
        // Only use extracted info if it's meaningful (more than 10 characters and doesn't look like fragments)
        if (businessInfo.mission && businessInfo.mission.length > 10 && !businessInfo.mission.includes('$')) {
          safeData.mission = businessInfo.mission;
        }
        if (businessInfo.vision && businessInfo.vision.length > 10 && !businessInfo.vision.includes('$')) {
          safeData.vision = businessInfo.vision;
        }
        if (businessInfo.valueProposition && businessInfo.valueProposition.length > 10 && !businessInfo.valueProposition.includes('$')) {
          safeData.valueProposition = businessInfo.valueProposition;
        }
      }

      if (businessContent.propuestaIntegral) {
        const propuestaInfo = confluenceService.extractKeyInfo(businessContent.propuestaIntegral.content);
        // Only use propuesta content if current data is still default and new content is valid
        if (safeData.mission.includes('Transformar') && propuestaInfo.mission && propuestaInfo.mission.length > 10 && !propuestaInfo.mission.includes('$')) {
          safeData.mission = propuestaInfo.mission;
        }
        if (safeData.vision.includes('Ser la plataforma') && propuestaInfo.vision && propuestaInfo.vision.length > 10 && !propuestaInfo.vision.includes('$')) {
          safeData.vision = propuestaInfo.vision;
        }
        if (safeData.valueProposition.includes('Descubre') && propuestaInfo.valueProposition && propuestaInfo.valueProposition.length > 10 && !propuestaInfo.valueProposition.includes('$')) {
          safeData.valueProposition = propuestaInfo.valueProposition;
        }
      }

      res.json(safeData);
    } catch (error: any) {
      console.error('Error fetching Confluence content:', error);
      res.status(500).json({ 
        error: 'Failed to fetch Confluence content', 
        details: error?.message || error 
      });
    }
  });

  // Test endpoint to check connection
  app.get('/api/confluence/test', async (req, res) => {
    try {
      const confluenceService = new ConfluenceService({
        baseUrl: process.env.CONFLUENCE_URL || '',
        email: process.env.CONFLUENCE_EMAIL || '',
        apiToken: process.env.CONFLUENCE_API_TOKEN || ''
      });

      const spaces = await confluenceService.getAllSpaces();
      res.json({ 
        status: 'Connected successfully', 
        spacesFound: spaces.length,
        spaces: spaces.map(s => ({ key: s.key, name: s.name }))
      });
    } catch (error: any) {
      console.error('Confluence connection test failed:', error);
      res.status(500).json({ 
        status: 'Connection failed', 
        error: error?.message || error 
      });
    }
  });

  // Helper function to validate Jira configuration
  const validateJiraConfig = () => {
    const host = process.env.JIRA_DOMAIN;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;
    
    if (!host || !email || !apiToken) {
      throw new Error('Jira configuration incomplete. Please set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.');
    }
    
    if (!host.includes('.atlassian.net')) {
      throw new Error('JIRA_DOMAIN must be in format: https://your-domain.atlassian.net');
    }
    
    return { host, email, apiToken };
  };

  // Helper function to validate project key
  const validateProjectKey = (projectKey: string) => {
    if (!/^[A-Z][A-Z0-9]+$/.test(projectKey)) {
      throw new Error('Invalid project key format. Must start with a letter and contain only uppercase letters and numbers.');
    }
  };

  // Jira integration endpoints (debug mode only)
  app.get('/api/jira/test', async (req, res) => {
    try {
      if (process.env.SHOW_JIRA_DEBUG !== 'true') {
        return res.status(404).json({ error: 'Jira integration is disabled' });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import('./jiraService')).JiraService(config);

      const connectionTest = await jiraService.testConnection();
      res.json(connectionTest);
    } catch (error: any) {
      console.error('Jira connection test failed:', error);
      res.status(500).json({ 
        status: 'Connection failed', 
        error: error?.message || error 
      });
    }
  });

  app.get('/api/jira/projects', async (req, res) => {
    try {
      if (process.env.SHOW_JIRA_DEBUG !== 'true') {
        return res.status(404).json({ error: 'Jira integration is disabled' });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import('./jiraService')).JiraService(config);

      const projects = await jiraService.getProjects();
      res.json({ projects });
    } catch (error: any) {
      console.error('Error fetching Jira projects:', error);
      res.status(500).json({ 
        error: 'Failed to fetch projects', 
        details: error?.message || error 
      });
    }
  });

  app.get('/api/jira/issues/recent', async (req, res) => {
    try {
      if (process.env.SHOW_JIRA_DEBUG !== 'true') {
        return res.status(404).json({ error: 'Jira integration is disabled' });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import('./jiraService')).JiraService(config);

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const maxResults = Math.min(Math.max(limit, 1), 100); // Limit between 1-100
      
      const issues = await jiraService.getRecentIssues(maxResults);
      res.json({ issues });
    } catch (error: any) {
      console.error('Error fetching recent Jira issues:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent issues', 
        details: error?.message || error 
      });
    }
  });

  app.get('/api/jira/projects/:projectKey/issues', async (req, res) => {
    try {
      if (process.env.SHOW_JIRA_DEBUG !== 'true') {
        return res.status(404).json({ error: 'Jira integration is disabled' });
      }

      const { projectKey } = req.params;
      
      try {
        validateProjectKey(projectKey);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: 'Invalid project key', 
          details: validationError.message 
        });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import('./jiraService')).JiraService(config);

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const maxResults = Math.min(Math.max(limit, 1), 100); // Limit between 1-100
      
      const issues = await jiraService.getProjectIssues(projectKey, maxResults);
      res.json({ issues });
    } catch (error: any) {
      console.error(`Error fetching issues for project ${req.params.projectKey}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch project issues', 
        details: error?.message || error 
      });
    }
  });

  // Jira specific issue endpoint
  app.get('/api/jira/issue/:issueKey', async (req, res) => {
    try {
      if (process.env.SHOW_JIRA_DEBUG !== 'true') {
        return res.status(404).json({ error: 'Jira integration is disabled' });
      }

      const { issueKey } = req.params;
      
      const config = validateJiraConfig();
      const jiraService = new (await import('./jiraService')).JiraService(config);

      const issue = await jiraService.getIssueByKey(issueKey);
      if (issue) {
        res.json({ issue });
      } else {
        res.status(404).json({ error: 'Issue not found' });
      }
    } catch (error: any) {
      console.error(`Error fetching issue ${req.params.issueKey}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch issue', 
        details: error?.message || error 
      });
    }
  });

  app.get('/api/jira/projects/:projectKey/stats', async (req, res) => {
    try {
      if (process.env.SHOW_JIRA_DEBUG !== 'true') {
        return res.status(404).json({ error: 'Jira integration is disabled' });
      }

      const { projectKey } = req.params;
      
      try {
        validateProjectKey(projectKey);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: 'Invalid project key', 
          details: validationError.message 
        });
      }

      const config = validateJiraConfig();
      const jiraService = new (await import('./jiraService')).JiraService(config);

      const stats = await jiraService.getProjectStats(projectKey);
      res.json(stats);
    } catch (error: any) {
      console.error(`Error fetching stats for project ${req.params.projectKey}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch project stats', 
        details: error?.message || error 
      });
    }
  });

  // Admin document download/preview endpoints  
  app.get('/api/admin/documents/:id/download', isAdmin, downloadRateLimit, async (req: any, res) => {
    try {
      // Import security utilities
      const { getSecureFileHeaders } = await import("./fileValidation");
      
      const documentId = req.params.id;
      console.log(`ADMIN ACCESS: Admin ${req.user.claims.email} downloading document ${documentId}`);

      // Admin can access any document - get document directly by ID
      const document = await storage.getMedicalDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Validate fileData exists
      if (!document.fileData) {
        console.error(`AUDIT: File data not found for document ${documentId} - Admin: ${req.user.claims.email}`);
        return res.status(500).json({ message: "File data not available" });
      }

      // Decode base64 file data
      const fileBuffer = Buffer.from(document.fileData, 'base64');
      
      // Enhanced security headers for file downloads
      const secureHeaders = getSecureFileHeaders(document.originalName, document.mimeType, false);
      res.set({
        ...secureHeaders,
        'Content-Length': fileBuffer.length.toString(),
      });

      // Audit logging for admin document downloads
      console.log(`AUDIT: Admin document download - Admin: ${req.user.claims.email}, Document: ${documentId}, Size: ${fileBuffer.length}`);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading admin file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  app.get('/api/admin/documents/:id/preview', isAdmin, previewRateLimit, async (req: any, res) => {
    try {
      // Import security utilities
      const { getSecureFileHeaders, PREVIEWABLE_MIME_TYPES } = await import("./fileValidation");
      
      const documentId = req.params.id;
      console.log(`ADMIN ACCESS: Admin ${req.user.claims.email} previewing document ${documentId}`);

      // Admin can access any document - get document directly by ID
      const document = await storage.getMedicalDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Validate fileData exists
      if (!document.fileData) {
        console.error(`AUDIT: File data not found for document ${documentId} - Admin: ${req.user.claims.email}`);
        return res.status(500).json({ message: "File data not available" });
      }

      // Check if file type can be previewed
      if (!PREVIEWABLE_MIME_TYPES.includes(document.mimeType as any)) {
        return res.status(400).json({ message: "File type cannot be previewed" });
      }

      // Decode base64 file data
      const fileBuffer = Buffer.from(document.fileData, 'base64');
      
      // Enhanced security headers for inline preview
      const secureHeaders = getSecureFileHeaders(document.originalName, document.mimeType, true);
      res.set({
        ...secureHeaders,
        'Content-Length': fileBuffer.length.toString(),
      });

      // Audit logging for admin document previews
      console.log(`AUDIT: Admin document preview - Admin: ${req.user.claims.email}, Document: ${documentId}, Size: ${fileBuffer.length}`);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error previewing admin file:", error);
      res.status(500).json({ message: "Failed to preview file" });
    }
  });

  // Admin routes for monitoring users and files (SECURED)
  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      // Basic admin check - you can enhance this with proper RBAC
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // For now, allow any authenticated user - you should implement proper admin role check
      console.log(`ADMIN ACCESS: User ${user?.email} accessed /api/admin/users`);
      
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/documents', isAdmin, async (req: any, res) => {
    try {
      // Basic admin check - you can enhance this with proper RBAC
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log(`ADMIN ACCESS: User ${user?.email} accessed /api/admin/documents`);
      
      const documents = await storage.getAllMedicalDocuments();
      res.json({ documents });
    } catch (error) {
      console.error("Error fetching admin documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get('/api/admin/stats', isAdmin, async (req: any, res) => {
    try {
      // Basic admin check - you can enhance this with proper RBAC
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log(`ADMIN ACCESS: User ${user?.email} accessed /api/admin/stats`);
      
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // LS-108: Security audit logs endpoint for administrators
  app.get('/api/admin/audit-logs', isAdmin, securityAdminRateLimit.middleware, async (req: any, res) => {
    try {
      await AuditLogger.logAdminAccess(req, 'audit-logs');

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
        userId
      });

      res.json({
        success: true,
        ...auditLogs
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      await AuditLogger.logFromRequest(req, 'ADMIN_ACCESS', 'ERROR', {
        resource: 'audit-logs',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor' 
      });
    }
  });

  // LS-104: Contact form endpoint for email sending
  app.post('/api/contacto', async (req, res) => {
    try {
      const { nombre, email, asunto, mensaje } = req.body;

      // Basic validation
      if (!nombre || !email || !asunto || !mensaje) {
        return res.status(400).json({ 
          message: "Todos los campos son requeridos" 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "El email no tiene un formato válido" 
        });
      }

      // Import nodemailer dynamically
      const nodemailer = await import('nodemailer');

      // Create SMTP transporter using environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
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
        to: 'contacto@evity.mx', // Evity contact email
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
        subject: 'Gracias por contactar a Evity - Hemos recibido tu mensaje',
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
                <li>Explorar nuestros <a href="${req.protocol}://${req.get('host')}/recursos" style="color: #0066cc;">recursos sobre longevidad</a></li>
                <li>Leer nuestro <a href="${req.protocol}://${req.get('host')}/blog" style="color: #0066cc;">blog especializado</a></li>
                <li>Conocer más sobre <a href="${req.protocol}://${req.get('host')}/" style="color: #0066cc;">nuestra misión</a></li>
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
        transporter.sendMail(autoReplyOptions)
      ]);

      // LS-104: Audit log for contact form submissions
      console.log(`AUDIT: Contact form submitted - Name: ${nombre}, Email: ${email}, Subject: ${asunto}`);

      res.json({ 
        success: true, 
        message: "Mensaje enviado correctamente" 
      });

    } catch (error: any) {
      console.error('Error sending contact email:', error);
      
      // Don't expose internal errors to client
      const errorMessage = error.code === 'EAUTH' ? 
        'Error de configuración del servidor de email' :
        'Error interno del servidor al enviar el mensaje';
        
      res.status(500).json({ 
        success: false,
        message: errorMessage 
      });
    }
  });


  const httpServer = createServer(app);

  return httpServer;
}
