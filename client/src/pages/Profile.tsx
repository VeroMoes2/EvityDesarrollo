import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, FileText, Trash2, User, Mail, Calendar, ArrowLeft, Shield, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para acceder a tu perfil",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch medical documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/profile/medical-documents"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/profile/medical-documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/medical-documents"] });
      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const documents = (documentsData as any)?.documents || [];
  const studyDocuments = documents.filter((doc: any) => doc.fileType === 'study');
  const labDocuments = documents.filter((doc: any) => doc.fileType === 'lab');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="button-back-home"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Inicio</span>
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card data-testid="card-user-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={(user as any)?.profileImageUrl} alt="Foto de perfil" />
                    <AvatarFallback>
                      {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg" data-testid="text-username">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </p>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      <span className="text-sm" data-testid="text-email">{(user as any)?.email}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Miembro desde {new Date((user as any)?.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">Perfil verificado</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Activity className="h-4 w-4 mr-2" />
                    <span className="text-sm">{studyDocuments.length + labDocuments.length} documentos cargados</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Documents */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Studies Section */}
              <Card data-testid="card-studies">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Estudios Médicos</span>
                      <Badge variant="secondary">{studyDocuments.length}</Badge>
                    </CardTitle>
                    <Button size="sm" className="flex items-center space-x-2" data-testid="button-upload-study">
                      <Upload className="h-4 w-4" />
                      <span>Subir Estudio</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Carga tus estudios médicos, radiografías, resonancias y otros estudios de imagen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Cargando estudios...</p>
                    </div>
                  ) : studyDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No tienes estudios médicos cargados</p>
                      <p className="text-sm">Sube tus primeros estudios para comenzar tu análisis personalizado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studyDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`document-study-${doc.id}`}>
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{doc.originalName}</p>
                              <p className="text-sm text-gray-500">
                                Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-study-${doc.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar estudio médico?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El documento "{doc.originalName}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(doc.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Labs Section */}
              <Card data-testid="card-labs">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Resultados de Laboratorios</span>
                      <Badge variant="secondary">{labDocuments.length}</Badge>
                    </CardTitle>
                    <Button size="sm" className="flex items-center space-x-2" data-testid="button-upload-lab">
                      <Upload className="h-4 w-4" />
                      <span>Subir Laboratorio</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Carga tus análisis de sangre, orina y otros resultados de laboratorio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Cargando laboratorios...</p>
                    </div>
                  ) : labDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No tienes resultados de laboratorio cargados</p>
                      <p className="text-sm">Sube tus análisis de laboratorio para obtener insights personalizados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {labDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`document-lab-${doc.id}`}>
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">{doc.originalName}</p>
                              <p className="text-sm text-gray-500">
                                Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-lab-${doc.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar resultado de laboratorio?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El documento "{doc.originalName}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(doc.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}