import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, TrendingUp, Calendar, Mail, User, Clock, HardDrive, Download, Eye, ClipboardCheck, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Helper function to check if user is admin using isAdmin field
const isUserAdmin = (user: any): boolean => {
  return user?.isAdmin === "true";
};

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  profileImageUrl: string | null;
  isAdmin: string | null;
  isEmailVerified: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  documentsCount: number;
  deletedDocumentsCount: number; // LS-103: Count of deleted files
}

interface AdminDocument {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: string;
  // fileData: REMOVED for security - no longer available in admin lists
  uploadedAt: string | null;
  userEmail: string | null;
  userName: string;
}

interface AdminStats {
  totalUsers: number;
  totalDocuments: number;
  documentsToday: number;
  usersToday: number;
  storageUsed: string;
}

interface QuestionnaireResult {
  id: string;
  userId: string;
  answers: any;
  longevityPoints: string;
  healthStatus: string;
  completedAt: string;
  userEmail: string;
  userName: string;
}

export default function Admin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userIsAdmin = isUserAdmin(user);

  // Redirect non-admin users and non-authenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Redirect unauthenticated users to home
      navigate('/');
      return;
    }
    
    if (!authLoading && isAuthenticated && !userIsAdmin) {
      toast({
        title: "Acceso Denegado",
        description: "No tienes permisos para acceder al panel de administración.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [authLoading, isAuthenticated, userIsAdmin, navigate, toast]);

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ['/api/admin/users'],
    enabled: userIsAdmin // Only fetch if user is admin
  });

  const { data: documentsData, isLoading: documentsLoading } = useQuery<{ documents: AdminDocument[] }>({
    queryKey: ['/api/admin/documents'],
    enabled: userIsAdmin // Only fetch if user is admin
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: userIsAdmin // Only fetch if user is admin
  });

  const { data: questionnaireResultsData, isLoading: questionnaireResultsLoading } = useQuery<{ results: QuestionnaireResult[] }>({
    queryKey: ['/api/admin/questionnaire-results'],
    enabled: userIsAdmin // Only fetch if user is admin
  });

  const formatFileSize = (sizeStr: string) => {
    const size = parseInt(sizeStr);
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No disponible';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Don't render anything if user is not admin
  if (!authLoading && (!isAuthenticated || !userIsAdmin)) {
    return null;
  }

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Verificando permisos...</div>
        </div>
      </div>
    );
  }

  if (usersLoading || documentsLoading || statsLoading || questionnaireResultsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {statsData?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{statsData?.usersToday || 0} hoy
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-documents">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Archivos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-documents">
                {statsData?.totalDocuments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{statsData?.documentsToday || 0} hoy
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-storage-used">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-storage-used">
                {statsData?.storageUsed || '0 bytes'}
              </div>
              <p className="text-xs text-muted-foreground">
                Espacio utilizado
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-documents-today">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-documents-today">
                {statsData?.documentsToday || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Archivos subidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users and Documents Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Users Table */}
          <Card data-testid="card-users-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Registrados
              </CardTitle>
              <CardDescription>
                Lista completa de usuarios y sus archivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {usersData?.users?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`user-item-${user.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium" data-testid={`user-name-${user.id}`}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email || 'Usuario Sin Nombre'}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email || 'Sin email'}
                        </div>
                        <div className="flex gap-4 mt-1">
                          <div className="text-xs text-muted-foreground">
                            Género: {user.gender || 'No especificado'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Registro: {formatDate(user.createdAt)}
                          </div>
                          {user.lastLoginAt && (
                            <div className="text-xs text-muted-foreground">
                              Último acceso: {formatDate(user.lastLoginAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-2">
                        {user.isAdmin === "true" && (
                          <Badge className="bg-primary text-primary-foreground">
                            Admin
                          </Badge>
                        )}
                        {user.isEmailVerified === "true" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="secondary" data-testid={`user-documents-count-${user.id}`}>
                          {user.documentsCount} archivo{user.documentsCount !== 1 ? 's' : ''} activo{user.documentsCount !== 1 ? 's' : ''}
                        </Badge>
                        {user.deletedDocumentsCount > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-600" data-testid={`user-deleted-count-${user.id}`}>
                            {user.deletedDocumentsCount} eliminado{user.deletedDocumentsCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!usersData?.users?.length && (
                  <div className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card data-testid="card-documents-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Archivos Subidos
              </CardTitle>
              <CardDescription>
                Lista de todos los archivos médicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {documentsData?.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`document-item-${doc.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate" data-testid={`document-name-${doc.id}`}>
                          {doc.originalName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Usuario: {doc.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.userEmail}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(doc.uploadedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge 
                        variant={doc.fileType === 'study' ? 'default' : 'secondary'}
                        data-testid={`document-type-${doc.id}`}
                      >
                        {doc.fileType === 'study' ? 'Estudio' : 'Laboratorio'}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid={`document-size-${doc.id}`}>
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const downloadUrl = `/api/admin/documents/${doc.id}/download`;
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = doc.originalName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (error) {
                              console.error('Error downloading document:', error);
                              // Handle error gracefully
                            }
                          }}
                          data-testid={`button-download-${doc.id}`}
                          title="Descargar documento"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              const previewUrl = `/api/admin/documents/${doc.id}/preview`;
                              window.open(previewUrl, '_blank');
                            } catch (error) {
                              console.error('Error previewing document:', error);
                              // Handle error gracefully
                            }
                          }}
                          data-testid={`button-preview-${doc.id}`}
                          title="Previsualizar documento"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!documentsData?.documents?.length && (
                  <div className="text-center text-muted-foreground py-8">
                    No hay archivos subidos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questionnaire Results Section */}
        <Card className="mt-6" data-testid="card-questionnaire-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Resultados de Cuestionarios
            </CardTitle>
            <CardDescription>
              Histórico completo de todos los cuestionarios completados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questionnaireResultsData?.results?.map((result) => {
                const getStatusColor = (points: string) => {
                  const numPoints = parseInt(points);
                  if (numPoints >= 84) return "text-green-600 dark:text-green-400";
                  if (numPoints >= 64) return "text-yellow-600 dark:text-yellow-400";
                  if (numPoints >= 44) return "text-orange-600 dark:text-orange-400";
                  return "text-red-600 dark:text-red-400";
                };

                const getStatusBadgeVariant = (points: string) => {
                  const numPoints = parseInt(points);
                  if (numPoints >= 84) return "default";
                  if (numPoints >= 64) return "secondary";
                  return "outline";
                };

                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`questionnaire-result-${result.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium" data-testid={`result-user-name-${result.id}`}>
                          {result.userName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.userEmail}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(result.completedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getStatusColor(result.longevityPoints)}`} data-testid={`result-points-${result.id}`}>
                          {result.longevityPoints}
                        </span>
                        <span className="text-sm text-muted-foreground">pts</span>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(result.longevityPoints)}
                        className="capitalize"
                        data-testid={`result-status-${result.id}`}
                      >
                        {result.healthStatus}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {!questionnaireResultsData?.results?.length && (
                <div className="text-center text-muted-foreground py-8">
                  No hay cuestionarios completados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}