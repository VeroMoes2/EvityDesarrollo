import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JiraProject, JiraProjectStats } from "@/hooks/useJiraData";
import { FolderOpen, User, BarChart3 } from "lucide-react";

interface JiraProjectCardProps {
  project: JiraProject;
  stats?: JiraProjectStats;
  isLoading?: boolean;
}

export default function JiraProjectCard({ project, stats, isLoading }: JiraProjectCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`jira-project-${project.key}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold">{project.name}</span>
          <Badge variant="outline" className="ml-auto">
            {project.key}
          </Badge>
        </CardTitle>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {project.lead && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Líder: {project.lead.displayName || 'Sin asignar'}</span>
          </div>
        )}
        
        {stats && !isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-medium">Total de issues: {stats.total}</span>
            </div>
            
            {Object.keys(stats.byStatus).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <Badge 
                    key={status} 
                    variant="secondary" 
                    className="text-xs"
                    data-testid={`status-${status.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
        
        {isLoading && (
          <div className="text-sm text-muted-foreground">
            Cargando estadísticas...
          </div>
        )}
      </CardContent>
    </Card>
  );
}