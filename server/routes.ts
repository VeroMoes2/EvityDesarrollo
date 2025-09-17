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
      
      // Extract key information from the content
      let extractedData = {
        businessPlan: null,
        propuestaIntegral: null,
        mission: '',
        vision: '',
        valueProposition: '',
        companyName: 'Evity',
        availableSpaces: businessContent.allSpaces,
        searchResults: businessContent.searchResults
      };

      if (businessContent.businessPlan) {
        const businessInfo = confluenceService.extractKeyInfo(businessContent.businessPlan.content);
        extractedData.businessPlan = businessInfo;
        if (businessInfo.mission) extractedData.mission = businessInfo.mission;
        if (businessInfo.vision) extractedData.vision = businessInfo.vision;
        if (businessInfo.valueProposition) extractedData.valueProposition = businessInfo.valueProposition;
      }

      if (businessContent.propuestaIntegral) {
        const propuestaInfo = confluenceService.extractKeyInfo(businessContent.propuestaIntegral.content);
        extractedData.propuestaIntegral = propuestaInfo;
        // Use propuesta content if main business plan doesn't have these sections
        if (!extractedData.mission && propuestaInfo.mission) extractedData.mission = propuestaInfo.mission;
        if (!extractedData.vision && propuestaInfo.vision) extractedData.vision = propuestaInfo.vision;
        if (!extractedData.valueProposition && propuestaInfo.valueProposition) extractedData.valueProposition = propuestaInfo.valueProposition;
      }

      res.json(extractedData);
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
