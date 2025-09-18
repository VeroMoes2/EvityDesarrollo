import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JiraIssue } from "@/hooks/useJiraData";
import { Bug, CheckCircle2, Clock, AlertCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface JiraIssueCardProps {
  issue: JiraIssue;
}

const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
  }
  if (statusLower.includes('progress') || statusLower.includes('development')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
  }
  if (statusLower.includes('todo') || statusLower.includes('open') || statusLower.includes('new')) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
  }
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
};

const getPriorityColor = (priority: string): string => {
  const priorityLower = priority.toLowerCase();
  if (priorityLower.includes('highest') || priorityLower.includes('critical')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
  }
  if (priorityLower.includes('high')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
  }
  if (priorityLower.includes('medium') || priorityLower.includes('normal')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
  }
  if (priorityLower.includes('low')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
};

const getIssueTypeIcon = (issueType: string) => {
  const typeLower = issueType.toLowerCase();
  if (typeLower.includes('bug')) {
    return <Bug className="h-4 w-4 text-red-500" />;
  }
  if (typeLower.includes('story') || typeLower.includes('feature')) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (typeLower.includes('task')) {
    return <Clock className="h-4 w-4 text-blue-500" />;
  }
  return <AlertCircle className="h-4 w-4 text-gray-500" />;
};

export default function JiraIssueCard({ issue }: JiraIssueCardProps) {
  const updatedDate = new Date(issue.updated);
  const timeAgo = formatDistanceToNow(updatedDate, { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <Card className="hover-elevate" data-testid={`jira-issue-${issue.key}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getIssueTypeIcon(issue.issueType)}
            <span className="text-sm font-mono text-muted-foreground">
              {issue.key}
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Badge 
              className={`text-xs ${getStatusColor(issue.status)}`}
              data-testid={`issue-status-${issue.status.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {issue.status}
            </Badge>
            {issue.priority && (
              <Badge 
                className={`text-xs ${getPriorityColor(issue.priority)}`}
                data-testid={`issue-priority-${issue.priority.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {issue.priority}
              </Badge>
            )}
          </div>
        </CardTitle>
        
        <h3 className="text-base font-medium leading-tight line-clamp-2">
          {issue.summary}
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {issue.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {issue.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">{issue.project.name}</span>
            <span>({issue.project.key})</span>
          </div>
          
          <div className="flex items-center gap-2">
            {issue.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{issue.assignee.displayName || 'Sin asignar'}</span>
              </div>
            )}
            <span>Actualizado {timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}