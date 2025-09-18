import axios from 'axios';

export interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface ConfluencePageData {
  id: string;
  title: string;
  content: string;
  spaceKey: string;
}

export class ConfluenceService {
  private config: ConfluenceConfig;
  private axiosInstance;

  constructor(config: ConfluenceConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: `${config.baseUrl}/wiki/rest/api`,
      auth: {
        username: config.email,
        password: config.apiToken
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllSpaces(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/space');
      return response.data.results;
    } catch (error) {
      console.error('Error fetching spaces:', error);
      throw error;
    }
  }

  async getPagesBySpaceKey(spaceKey: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/content`, {
        params: {
          spaceKey: spaceKey,
          type: 'page',
          expand: 'body.storage,space,version',
          limit: 100
        }
      });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching pages from space ${spaceKey}:`, error);
      throw error;
    }
  }

  async getPageByTitle(spaceKey: string, title: string): Promise<ConfluencePageData | null> {
    try {
      const response = await this.axiosInstance.get(`/content`, {
        params: {
          spaceKey: spaceKey,
          title: title,
          type: 'page',
          expand: 'body.storage,space,version',
          limit: 1
        }
      });
      
      if (response.data.results.length === 0) {
        return null;
      }

      const page = response.data.results[0];
      return {
        id: page.id,
        title: page.title,
        content: page.body?.storage?.value || '',
        spaceKey: page.space.key
      };
    } catch (error) {
      console.error(`Error fetching page '${title}' from space ${spaceKey}:`, error);
      throw error;
    }
  }

  async searchPages(cqlQuery: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/content/search`, {
        params: {
          cql: cqlQuery,
          expand: 'body.storage,space,version',
          limit: 50
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching pages:', error);
      throw error;
    }
  }

  async getBusinessPlanContent(): Promise<any> {
    try {
      // First, try to find the "Evity Business Plan" space or page
      const spaces = await this.getAllSpaces();
      console.log('Available spaces:', spaces.map(s => ({ key: s.key, name: s.name })));

      // Search for business plan content
      const searchResults = await this.searchPages('title ~ "Evity Business Plan" OR title ~ "Evity - Propuesta integral"');
      console.log('Search results:', searchResults.map(r => ({ id: r.id, title: r.title, spaceKey: r.space?.key })));

      // Try to get content from different approaches
      let businessPlanContent = null;
      let propuestaIntegralContent = null;

      // Approach 1: Direct search results
      for (const result of searchResults) {
        if (result.title.includes('Evity Business Plan')) {
          businessPlanContent = {
            id: result.id,
            title: result.title,
            content: result.body?.storage?.value || '',
            spaceKey: result.space?.key
          };
        }
        if (result.title.includes('Evity - Propuesta integral')) {
          propuestaIntegralContent = {
            id: result.id,
            title: result.title,
            content: result.body?.storage?.value || '',
            spaceKey: result.space?.key
          };
        }
      }

      // Approach 2: Search in each space
      if (!businessPlanContent || !propuestaIntegralContent) {
        for (const space of spaces) {
          try {
            const pages = await this.getPagesBySpaceKey(space.key);
            console.log(`Pages in ${space.key}:`, pages.map(p => p.title));

            for (const page of pages) {
              if (page.title.includes('Evity Business Plan') && !businessPlanContent) {
                businessPlanContent = {
                  id: page.id,
                  title: page.title,
                  content: page.body?.storage?.value || '',
                  spaceKey: page.space.key
                };
              }
              if (page.title.includes('Evity - Propuesta integral') && !propuestaIntegralContent) {
                propuestaIntegralContent = {
                  id: page.id,
                  title: page.title,
                  content: page.body?.storage?.value || '',
                  spaceKey: page.space.key
                };
              }
            }
          } catch (spaceError: any) {
            console.log(`Could not access space ${space.key}:`, spaceError?.message || spaceError);
          }
        }
      }

      return {
        businessPlan: businessPlanContent,
        propuestaIntegral: propuestaIntegralContent,
        allSpaces: spaces,
        searchResults: searchResults
      };
    } catch (error) {
      console.error('Error getting business plan content:', error);
      throw error;
    }
  }

  // Helper method to decode HTML entities
  private decodeHtmlEntities(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&aacute;': 'á',
      '&eacute;': 'é',
      '&iacute;': 'í',
      '&oacute;': 'ó',
      '&uacute;': 'ú',
      '&Aacute;': 'Á',
      '&Eacute;': 'É',
      '&Iacute;': 'Í',
      '&Oacute;': 'Ó',
      '&Uacute;': 'Ú',
      '&ntilde;': 'ñ',
      '&Ntilde;': 'Ñ',
      '&ccedil;': 'ç',
      '&Ccedil;': 'Ç',
      '&agrave;': 'à',
      '&egrave;': 'è',
      '&igrave;': 'ì',
      '&ograve;': 'ò',
      '&ugrave;': 'ù',
      '&acirc;': 'â',
      '&ecirc;': 'ê',
      '&icirc;': 'î',
      '&ocirc;': 'ô',
      '&ucirc;': 'û',
      '&auml;': 'ä',
      '&euml;': 'ë',
      '&iuml;': 'ï',
      '&ouml;': 'ö',
      '&uuml;': 'ü',
      '&nbsp;': ' ',
      '&iexcl;': '¡',
      '&iquest;': '¿'
    };

    let decodedText = text;
    
    // Replace known HTML entities
    for (const [entity, character] of Object.entries(htmlEntities)) {
      decodedText = decodedText.replace(new RegExp(entity, 'g'), character);
    }
    
    // Handle numeric entities like &#233; (é)
    decodedText = decodedText.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    // Handle hex entities like &#x27; (')
    decodedText = decodedText.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decodedText;
  }

  // Helper method to clean HTML content and extract key information
  extractKeyInfo(htmlContent: string): any {
    console.log('Original HTML content (first 200 chars):', htmlContent.substring(0, 200));
    
    // First decode HTML entities, then remove HTML tags and extract key sections
    let cleanText = this.decodeHtmlEntities(htmlContent);
    console.log('After decoding entities (first 200 chars):', cleanText.substring(0, 200));
    
    cleanText = cleanText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Final clean text (first 200 chars):', cleanText.substring(0, 200));
    
    // Try to extract mission, vision, value proposition
    const sections = {
      mission: '',
      vision: '',
      valueProposition: '',
      fullContent: cleanText
    };

    // Look for common patterns in Spanish
    const missionMatch = cleanText.match(/(?:misión|mision)[:\s]*(.*?)(?:\n|\.(?:\s|$)|visión|vision|propuesta)/i);
    if (missionMatch) sections.mission = missionMatch[1].trim();

    const visionMatch = cleanText.match(/(?:visión|vision)[:\s]*(.*?)(?:\n|\.(?:\s|$)|misión|mision|propuesta)/i);
    if (visionMatch) sections.vision = visionMatch[1].trim();

    const valueMatch = cleanText.match(/(?:propuesta de valor|valor)[:\s]*(.*?)(?:\n|\.(?:\s|$)|misión|mision|visión|vision)/i);
    if (valueMatch) sections.valueProposition = valueMatch[1].trim();

    return sections;
  }
}