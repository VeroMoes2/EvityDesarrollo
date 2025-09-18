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
   * Get issues from a specific project
   */
  async getProjectIssues(projectKey: string, maxResults: number = 20): Promise<JiraIssue[]> {
    try {
      const searchResult = await this.client.issueSearch.searchForIssuesUsingJql({
        jql: `project = "${projectKey}" ORDER BY updated DESC`,
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
   * Get recent issues across all projects
   */
  async getRecentIssues(maxResults: number = 10): Promise<JiraIssue[]> {
    try {
      const searchResult = await this.client.issueSearch.searchForIssuesUsingJql({
        jql: `assignee = currentUser() OR reporter = currentUser() ORDER BY updated DESC`,
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
}