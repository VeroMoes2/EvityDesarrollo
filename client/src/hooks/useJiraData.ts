import { useQuery } from '@tanstack/react-query';

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

export interface JiraConnectionTest {
  status: string;
  user: {
    displayName?: string;
    accountId?: string;
  };
}

export interface JiraProjectStats {
  total: number;
  byStatus: Record<string, number>;
}

// Test Jira connection
export function useJiraConnectionTest() {
  return useQuery<JiraConnectionTest>({
    queryKey: ['/api/jira/test'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Get all Jira projects
export function useJiraProjects() {
  return useQuery<{ projects: JiraProject[] }>({
    queryKey: ['/api/jira/projects'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// Get recent issues
export function useJiraRecentIssues(limit: number = 10) {
  return useQuery<{ issues: JiraIssue[] }>({
    queryKey: [`/api/jira/issues/recent?limit=${limit}`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

// Get issues for a specific project
export function useJiraProjectIssues(projectKey: string, limit: number = 20) {
  return useQuery<{ issues: JiraIssue[] }>({
    queryKey: [`/api/jira/projects/${projectKey}/issues?limit=${limit}`],
    enabled: !!projectKey,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

// Get project statistics
export function useJiraProjectStats(projectKey: string) {
  return useQuery<JiraProjectStats>({
    queryKey: [`/api/jira/projects/${projectKey}/stats`],
    enabled: !!projectKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}