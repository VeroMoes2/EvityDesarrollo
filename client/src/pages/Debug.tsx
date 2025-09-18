import Header from "@/components/Header";
import ConfluenceDebug from "@/components/ConfluenceDebug";
import JiraProjectCard from "@/components/JiraProjectCard";
import { useJiraProjects, useJiraProjectStats, useJiraConnectionTest } from "@/hooks/useJiraData";

export default function Debug() {
  const { data: jiraTest } = useJiraConnectionTest();
  const { data: projectsData } = useJiraProjects();
  const evityProject = projectsData?.projects?.find(p => p.key === 'LS');
  const { data: projectStats } = useJiraProjectStats(evityProject?.key || '');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Información Corporativa - Evity
              </h1>
              <p className="text-muted-foreground">
                Transparencia total sobre el desarrollo y la conexión con nuestros sistemas corporativos.
              </p>
            </div>
            
            {/* Jira Project Information - Solo en modo debug */}
            {import.meta.env.VITE_SHOW_DEBUG === 'true' && jiraTest?.status && evityProject && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Estado del Proyecto Evity
                </h2>
                <JiraProjectCard 
                  project={evityProject}
                  stats={projectStats}
                  isLoading={!projectStats}
                />
              </div>
            )}
            
            {import.meta.env.VITE_SHOW_DEBUG === 'true' ? (
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Diagnóstico Técnico
                </h2>
                <ConfluenceDebug />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Modo diagnóstico deshabilitado</p>
                <p className="text-sm mt-2">Configura VITE_SHOW_DEBUG=true para habilitar funciones de diagnóstico</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}