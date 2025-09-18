import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfluenceData, useConfluenceTest } from "@/hooks/useConfluenceData";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function ConfluenceDebug() {
  const { data: confluenceData, isLoading: isContentLoading, error: contentError, refetch: refetchContent } = useConfluenceData();
  const { data: testData, isLoading: isTestLoading, error: testError, refetch: refetchTest } = useConfluenceTest();

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isTestLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : testError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : testData ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
            Test de Conexión Confluence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTestLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Probando conexión...</span>
            </div>
          )}
          
          {testError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                Error de conexión: {(testError as any)?.message || 'Error desconocido'}
              </p>
            </div>
          )}
          
          {testData && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  {(testData as any)?.status || 'Estado desconocido'}
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Espacios encontrados: {(testData as any)?.spacesFound || 0}
                </p>
              </div>
              
              {(testData as any)?.spaces && (testData as any).spaces.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Espacios disponibles:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(testData as any).spaces.map((space: any) => (
                      <Badge key={space.key} variant="outline">
                        {space.key}: {space.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => refetchTest()} 
            variant="outline" 
            size="sm"
            disabled={isTestLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconectar
          </Button>
        </CardContent>
      </Card>

      {/* Content Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isContentLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : contentError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : confluenceData ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
            Extracción de Contenido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isContentLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Extrayendo contenido del plan de negocio...</span>
            </div>
          )}
          
          {contentError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                Error al extraer contenido: {(contentError as any)?.message || 'Error desconocido'}
              </p>
            </div>
          )}
          
          {confluenceData && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium mb-2">Información Extraída:</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Empresa:</strong> {(confluenceData as any).companyName}</div>
                  {(confluenceData as any).mission && (
                    <div><strong>Misión:</strong> {(confluenceData as any).mission}</div>
                  )}
                  {(confluenceData as any).vision && (
                    <div><strong>Visión:</strong> {(confluenceData as any).vision}</div>
                  )}
                  {(confluenceData as any).valueProposition && (
                    <div><strong>Propuesta de Valor:</strong> {(confluenceData as any).valueProposition}</div>
                  )}
                </div>
              </div>

              {(confluenceData as any).searchResults && (confluenceData as any).searchResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Páginas encontradas:</h4>
                  <div className="space-y-1">
                    {(confluenceData as any).searchResults.map((result: any) => (
                      <div key={result.id} className="text-sm p-2 bg-muted rounded">
                        <strong>{result.title}</strong> (ID: {result.id})
                        {result.space && <span className="text-muted-foreground ml-2">en {result.space.key}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => refetchContent()} 
            variant="outline" 
            size="sm"
            disabled={isContentLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar Contenido
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}