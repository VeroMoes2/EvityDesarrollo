import { Version3Client } from 'jira.js';

export interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  assignee?: {
    displayName?: string;
  };
  priority: string;
  created: string;
  updated: string;
  issueType: string;
  project: {
    key: string;
    name: string;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead?: {
    displayName?: string;
  };
  projectTypeKey: string;
}

export class JiraService {
  private client: Version3Client;

  constructor(config: JiraConfig) {
    this.client = new Version3Client({
      host: config.host,
      authentication: {
        basic: {
          email: config.email,
          apiToken: config.apiToken
        }
      }
    });
  }

  /**
   * Test the connection to Jira
   */
  async testConnection(): Promise<{ status: string; user: { displayName?: string; accountId?: string } }> {
    try {
      const user = await this.client.myself.getCurrentUser();
      return {
        status: 'Connected successfully to Jira',
        user: {
          displayName: user.displayName,
          accountId: user.accountId
        }
      };
    } catch (error) {
      throw new Error(`Failed to connect to Jira: ${error}`);
    }
  }

  /**
   * Get all accessible projects
   */
  async getProjects(): Promise<JiraProject[]> {
    try {
      const projects = await this.client.projects.searchProjects({
        maxResults: 50
      });

      return projects.values?.map(project => ({
        id: project.id!,
        key: project.key!,
        name: project.name!,
        description: project.description,
        lead: project.lead ? {
          displayName: project.lead.displayName
        } : undefined,
        projectTypeKey: project.projectTypeKey!
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error}`);
    }
  }

  /**
   * Get issues from a specific project with fallback methods
   */
  async getProjectIssues(projectKey: string, maxResults: number = 20): Promise<JiraIssue[]> {
    try {
      // Try a simpler query first
      const searchResult = await this.client.issueSearch.searchForIssuesUsingJql({
        jql: `project = ${projectKey} ORDER BY updated DESC`,
        maxResults,
        fields: ['summary', 'description', 'status', 'assignee', 'priority', 'created', 'updated', 'issuetype', 'project']
      });

      return searchResult.issues?.map(issue => ({
        id: issue.id!,
        key: issue.key!,
        summary: issue.fields?.summary || '',
        description: typeof issue.fields?.description === 'string' ? issue.fields.description : '',
        status: issue.fields?.status?.name || '',
        assignee: issue.fields?.assignee ? {
          displayName: issue.fields.assignee.displayName
        } : undefined,
        priority: issue.fields?.priority?.name || '',
        created: issue.fields?.created || '',
        updated: issue.fields?.updated || '',
        issueType: issue.fields?.issuetype?.name || '',
        project: {
          key: issue.fields?.project?.key || '',
          name: issue.fields?.project?.name || ''
        }
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch issues for project ${projectKey}: ${error}`);
    }
  }

  /**
   * Search for a specific issue by key
   */
  async getIssueByKey(issueKey: string): Promise<JiraIssue | null> {
    try {
      const issue = await this.client.issues.getIssue({
        issueIdOrKey: issueKey,
        fields: ['summary', 'description', 'status', 'assignee', 'priority', 'created', 'updated', 'issuetype', 'project']
      });

      return {
        id: issue.id!,
        key: issue.key!,
        summary: issue.fields?.summary || '',
        description: typeof issue.fields?.description === 'string' ? issue.fields.description : '',
        status: issue.fields?.status?.name || '',
        assignee: issue.fields?.assignee ? {
          displayName: issue.fields.assignee.displayName
        } : undefined,
        priority: issue.fields?.priority?.name || '',
        created: issue.fields?.created || '',
        updated: issue.fields?.updated || '',
        issueType: issue.fields?.issuetype?.name || '',
        project: {
          key: issue.fields?.project?.key || '',
          name: issue.fields?.project?.name || ''
        }
      };
    } catch (error) {
      console.error(`Failed to fetch issue ${issueKey}:`, error);
      return null;
    }
  }

  /**
   * Get recent issues across all projects with simpler JQL
   */
  async getRecentIssues(maxResults: number = 10): Promise<JiraIssue[]> {
    try {
      // Try a simpler query first
      const searchResult = await this.client.issueSearch.searchForIssuesUsingJql({
        jql: `ORDER BY updated DESC`,
        maxResults,
        fields: ['summary', 'description', 'status', 'assignee', 'priority', 'created', 'updated', 'issuetype', 'project']
      });

      return searchResult.issues?.map(issue => ({
        id: issue.id!,
        key: issue.key!,
        summary: issue.fields?.summary || '',
        description: typeof issue.fields?.description === 'string' ? issue.fields.description : '',
        status: issue.fields?.status?.name || '',
        assignee: issue.fields?.assignee ? {
          displayName: issue.fields.assignee.displayName
        } : undefined,
        priority: issue.fields?.priority?.name || '',
        created: issue.fields?.created || '',
        updated: issue.fields?.updated || '',
        issueType: issue.fields?.issuetype?.name || '',
        project: {
          key: issue.fields?.project?.key || '',
          name: issue.fields?.project?.name || ''
        }
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch recent issues: ${error}`);
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectKey: string): Promise<{ total: number; byStatus: Record<string, number> }> {
    try {
      // Get total count
      const totalResult = await this.client.issueSearch.searchForIssuesUsingJql({
        jql: `project = "${projectKey}"`,
        maxResults: 0
      });

      // Get issues grouped by status  
      const statusResult = await this.client.issueSearch.searchForIssuesUsingJql({
        jql: `project = "${projectKey}"`,
        maxResults: 1000,
        fields: ['status']
      });

      const statusCounts: Record<string, number> = {};
      statusResult.issues?.forEach(issue => {
        const status = issue.fields?.status?.name || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      return {
        total: totalResult.total || 0,
        byStatus: statusCounts
      };
    } catch (error) {
      throw new Error(`Failed to fetch project stats for ${projectKey}: ${error}`);
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getIssueTransitions(issueKey: string): Promise<Array<{ id: string; name: string; to: { name: string } }>> {
    try {
      const transitions = await this.client.issues.getTransitions({
        issueIdOrKey: issueKey
      });

      return transitions.transitions?.map(transition => ({
        id: transition.id!,
        name: transition.name!,
        to: { name: transition.to?.name || '' }
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get transitions for issue ${issueKey}: ${error}`);
    }
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(issueKey: string, transitionId: string, comment?: string): Promise<void> {
    try {
      const transitionData: any = {
        transition: {
          id: transitionId
        }
      };

      // Add comment if provided
      if (comment) {
        transitionData.update = {
          comment: [{
            add: {
              body: comment
            }
          }]
        };
      }

      await this.client.issues.doTransition({
        issueIdOrKey: issueKey,
        ...transitionData
      });
    } catch (error) {
      throw new Error(`Failed to transition issue ${issueKey}: ${error}`);
    }
  }

  /**
   * Mark an issue as done/completed
   */
  async markIssueAsCompleted(issueKey: string, comment?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get available transitions
      const transitions = await this.getIssueTransitions(issueKey);
      
      // Look for completion transitions (Done, Completed, Cerrado, etc.)
      const completionTransition = transitions.find(t => 
        ['Done', 'Completed', 'Cerrado', 'Terminado', 'Finalizado'].includes(t.to.name)
      );

      if (!completionTransition) {
        return {
          success: false,
          message: `No se encontró transición de completado disponible para ${issueKey}. Transiciones disponibles: ${transitions.map(t => t.to.name).join(', ')}`
        };
      }

      // Execute the transition
      await this.transitionIssue(issueKey, completionTransition.id, comment);

      return {
        success: true,
        message: `${issueKey} marcado como ${completionTransition.to.name} exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al marcar ${issueKey} como completado: ${error}`
      };
    }
  }
}