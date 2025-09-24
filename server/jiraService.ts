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
    accountId?: string;
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

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string };
  fields?: Record<string, {
    required: boolean;
    hasDefaultValue: boolean;
    name: string;
    allowedValues?: Array<{ id: string; name: string; value?: string }>;
  }>;
}

export interface JiraPermissions {
  [permissionKey: string]: {
    id: string;
    key: string;
    name: string;
    havePermission: boolean;
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
   * Get available transitions for an issue with field metadata
   */
  async getIssueTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      const transitions = await this.client.issues.getTransitions({
        issueIdOrKey: issueKey,
        expand: 'transitions.fields'
      });

      return transitions.transitions?.map(transition => ({
        id: transition.id!,
        name: transition.name!,
        to: { name: transition.to?.name || '' },
        fields: transition.fields ? Object.entries(transition.fields).reduce((acc, [key, field]) => {
          acc[key] = {
            required: field.required || false,
            hasDefaultValue: field.hasDefaultValue || false,
            name: field.name || key,
            allowedValues: field.allowedValues || undefined
          };
          return acc;
        }, {} as Record<string, any>) : undefined
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get transitions for issue ${issueKey}: ${error}`);
    }
  }

  /**
   * Check user permissions for issue operations
   */
  async checkPermissions(issueKey?: string): Promise<JiraPermissions> {
    try {
      const permissions = await this.client.permissions.getMyPermissions({
        issueKey,
        permissions: 'TRANSITION_ISSUES,RESOLVE_ISSUES,ASSIGN_ISSUES'
      });

      return permissions.permissions || ({} as JiraPermissions);
    } catch (error) {
      console.warn(`Could not check permissions: ${error}`);
      return {} as JiraPermissions;
    }
  }

  /**
   * Get available resolutions for the project
   */
  async getResolutions(): Promise<Array<{ id: string; name: string; description?: string }>> {
    try {
      const resolutions = await this.client.issueResolutions.getResolutions();
      return resolutions.map(res => ({
        id: res.id!,
        name: res.name!,
        description: res.description
      }));
    } catch (error) {
      console.warn(`Could not fetch resolutions: ${error}`);
      return [{ id: '1', name: 'Done' }]; // Default fallback
    }
  }

  /**
   * Transition an issue to a new status with automatic field population
   */
  async transitionIssue(issueKey: string, transitionId: string, comment?: string): Promise<void> {
    try {
      // Get transition metadata to understand required fields
      const transitions = await this.getIssueTransitions(issueKey);
      const targetTransition = transitions.find(t => t.id === transitionId);
      
      if (!targetTransition) {
        throw new Error(`Transition ${transitionId} not found for issue ${issueKey}`);
      }

      const transitionData: any = {
        transition: {
          id: transitionId
        },
        fields: {},
        update: {}
      };

      // Handle required fields automatically
      if (targetTransition.fields) {
        for (const [fieldKey, fieldMeta] of Object.entries(targetTransition.fields)) {
          if (fieldMeta.required && !fieldMeta.hasDefaultValue) {
            console.log(`Processing required field: ${fieldKey} (${fieldMeta.name})`);
            
            // Handle resolution field specifically
            if (fieldKey === 'resolution') {
              const resolutions = await this.getResolutions();
              const defaultResolution = resolutions.find(r => r.name === 'Done') || resolutions[0];
              if (defaultResolution) {
                transitionData.fields.resolution = { id: defaultResolution.id };
                console.log(`Setting resolution to: ${defaultResolution.name}`);
              }
            }
            // Handle assignee field
            else if (fieldKey === 'assignee') {
              const currentUser = await this.client.myself.getCurrentUser();
              if (currentUser.accountId) {
                transitionData.fields.assignee = { accountId: currentUser.accountId };
                console.log(`Setting assignee to current user: ${currentUser.displayName}`);
              }
            }
            // Handle other required fields with default values
            else if (fieldMeta.allowedValues && fieldMeta.allowedValues.length > 0) {
              const defaultValue = fieldMeta.allowedValues[0];
              if (defaultValue.id) {
                transitionData.fields[fieldKey] = { id: defaultValue.id };
              } else if (defaultValue.value) {
                transitionData.fields[fieldKey] = defaultValue.value;
              }
              console.log(`Setting ${fieldKey} to default value: ${defaultValue.name || defaultValue.value}`);
            }
          }
        }
      }

      // Add comment if provided
      if (comment) {
        transitionData.update.comment = [{
          add: {
            body: comment
          }
        }];
      }

      console.log(`Executing transition with data:`, JSON.stringify(transitionData, null, 2));
      
      await this.client.issues.doTransition({
        issueIdOrKey: issueKey,
        ...transitionData
      });
    } catch (error) {
      throw new Error(`Failed to transition issue ${issueKey}: ${error}`);
    }
  }

  /**
   * Mark an issue as done/completed with enhanced automation
   */
  async markIssueAsCompleted(issueKey: string, comment?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get current issue info
      const issue = await this.getIssueByKey(issueKey);
      if (!issue) {
        return {
          success: false,
          message: `Issue ${issueKey} not found`
        };
      }

      console.log(`Current issue status: ${issue.status}`);

      // Check permissions first
      const permissions = await this.checkPermissions(issueKey);
      console.log(`User permissions:`, permissions);

      // Verify transition permissions
      const hasTransitionPermission = permissions.TRANSITION_ISSUES?.havePermission !== false;
      const hasResolvePermission = permissions.RESOLVE_ISSUES?.havePermission !== false;
      
      if (!hasTransitionPermission || !hasResolvePermission) {
        console.warn(`Limited permissions detected. Transition: ${hasTransitionPermission}, Resolve: ${hasResolvePermission}`);
        // Continue anyway as permissions check might not be accurate
      }

      // Get available transitions with field metadata
      let transitions = await this.getIssueTransitions(issueKey);
      console.log(`Available transitions from ${issue.status}:`, transitions.map(t => `${t.name} → ${t.to.name} (required fields: ${Object.keys(t.fields || {}).filter(k => t.fields![k].required).join(', ') || 'none'})`));
      
      // Look for completion transitions (Done, Completed, Cerrado, Finalizada, etc.)
      let completionTransition = transitions.find(t => 
        ['Done', 'Completed', 'Cerrado', 'Terminado', 'Finalizado', 'Finalizada'].includes(t.to.name)
      );

      // If not directly available, try to move through intermediate states
      if (!completionTransition) {
        // Try to move to "En curso" first if available
        const inProgressTransition = transitions.find(t => 
          ['En curso', 'In Progress', 'En progreso'].includes(t.to.name)
        );
        
        if (inProgressTransition) {
          console.log(`Moving to in-progress state first: ${inProgressTransition.to.name}`);
          console.log(`Required fields for in-progress transition:`, Object.keys(inProgressTransition.fields || {}).filter(k => inProgressTransition.fields![k].required));
          
          await this.transitionIssue(issueKey, inProgressTransition.id, 'Moviendo a en curso para completar');
          
          // Wait a moment for Jira to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get new transitions after moving to in progress
          transitions = await this.getIssueTransitions(issueKey);
          console.log(`New transitions after moving to in-progress:`, transitions.map(t => `${t.name} → ${t.to.name} (required fields: ${Object.keys(t.fields || {}).filter(k => t.fields![k].required).join(', ') || 'none'})`));
          
          completionTransition = transitions.find(t => 
            ['Done', 'Completed', 'Cerrado', 'Terminado', 'Finalizado', 'Finalizada'].includes(t.to.name)
          );
        }
      }

      if (!completionTransition) {
        return {
          success: false,
          message: `No se encontró transición de completado disponible para ${issueKey}. Transiciones disponibles: ${transitions.map(t => t.to.name).join(', ')}`
        };
      }

      // Execute the final completion transition
      console.log(`Executing final transition to: ${completionTransition.to.name}`);
      console.log(`Required fields for completion transition:`, Object.keys(completionTransition.fields || {}).filter(k => completionTransition.fields![k].required));
      
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