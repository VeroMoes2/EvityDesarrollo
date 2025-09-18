import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ConfluenceService } from "./confluenceService";

export async function registerRoutes(app: Express): Promise<Server> {
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
        mission: '',
        vision: '',
        valueProposition: ''
      };

      // Add debug data only if explicitly enabled
      if (process.env.SHOW_CONFLUENCE_DEBUG === 'true') {
        (safeData as any).availableSpaces = businessContent.allSpaces;
        (safeData as any).searchResults = businessContent.searchResults;
      }

      if (businessContent.businessPlan) {
        const businessInfo = confluenceService.extractKeyInfo(businessContent.businessPlan.content);
        if (businessInfo.mission) safeData.mission = businessInfo.mission;
        if (businessInfo.vision) safeData.vision = businessInfo.vision;
        if (businessInfo.valueProposition) safeData.valueProposition = businessInfo.valueProposition;
      }

      if (businessContent.propuestaIntegral) {
        const propuestaInfo = confluenceService.extractKeyInfo(businessContent.propuestaIntegral.content);
        // Use propuesta content if main business plan doesn't have these sections
        if (!safeData.mission && propuestaInfo.mission) safeData.mission = propuestaInfo.mission;
        if (!safeData.vision && propuestaInfo.vision) safeData.vision = propuestaInfo.vision;
        if (!safeData.valueProposition && propuestaInfo.valueProposition) safeData.valueProposition = propuestaInfo.valueProposition;
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
