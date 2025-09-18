import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { ConfluenceService } from "./confluenceService";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // LS-96: Medical documents endpoints for user profile system
  app.get('/api/profile/medical-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserMedicalDocuments(userId);
      res.json({ documents });
    } catch (error) {
      console.error("Error fetching medical documents:", error);
      res.status(500).json({ message: "Failed to fetch medical documents" });
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
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting medical document:", error);
      res.status(500).json({ message: "Failed to delete medical document" });
    }
  });

  // File upload endpoint
  app.post('/api/profile/medical-documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      // Import validation schema
      const { insertMedicalDocumentSchema } = await import("@shared/schema");
      
      const userId = req.user.claims.sub;
      const file = req.file;
      const { fileType, originalName } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create document record with file data
      const documentData = {
        userId,
        fileType,
        originalName: originalName || file.originalname,
        filename: `${Date.now()}_${file.originalname}`,
        fileSize: file.size.toString(),
        mimeType: file.mimetype,
        fileData: file.buffer.toString('base64'), // Store file as base64 in database
      };

      // Validate document data with schema
      const validationResult = insertMedicalDocumentSchema.safeParse(documentData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid file data", 
          errors: validationResult.error.issues 
        });
      }

      const document = await storage.createMedicalDocument(validationResult.data);
      
      res.json({ 
        message: "File uploaded successfully",
        document: {
          id: document.id,
          originalName: document.originalName,
          fileSize: document.fileSize,
          uploadedAt: document.uploadedAt
        }
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
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
      
      // Extract key information from the content - ONLY return safe, whitelisted fields
      let safeData = {
        companyName: 'Evity',
        mission: 'Transformar la forma en que las personas envejecen, proporcionando herramientas científicas y personalizadas para vivir vidas más largas, saludables y plenas.',
        vision: 'Ser la plataforma líder mundial en longevidad, democratizando el acceso a los últimos avances científicos para que cada persona pueda alcanzar su máximo potencial de salud y bienestar.',
        valueProposition: 'Descubre los secretos científicos de la longevidad. Herramientas personalizadas, recursos basados en evidencia y una comunidad dedicada a vivir más y mejor.'
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

  const httpServer = createServer(app);

  return httpServer;
}
