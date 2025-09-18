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

  const httpServer = createServer(app);

  return httpServer;
}
