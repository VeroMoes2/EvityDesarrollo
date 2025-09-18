import Header from "@/components/Header";
import ConfluenceDebug from "@/components/ConfluenceDebug";

export default function Debug() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Debug Confluence
              </h1>
              <p className="text-muted-foreground">
                Panel de diagnóstico para la conexión con Confluence y extracción de contenido.
              </p>
            </div>
            
            {import.meta.env.VITE_SHOW_DEBUG === 'true' ? (
              <ConfluenceDebug />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Debug mode is disabled</p>
                <p className="text-sm mt-2">Set VITE_SHOW_DEBUG=true to enable debug features</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}