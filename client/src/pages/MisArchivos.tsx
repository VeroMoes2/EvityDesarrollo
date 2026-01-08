import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  FileType,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

// Types for medical documents
interface MedicalDocument {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: string;
  uploadedAt: string;
}

interface DocumentsResponse {
  documents: MedicalDocument[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export default function MisArchivos() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleteError, setDeleteError] = useState<{documentId: string, documentName: string, error: string} | null>(null);

  // Mutation for deleting documents
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/profile/medical-documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, documentId) => {
      // Invalidate and refetch the documents list
      queryClient.invalidateQueries({ queryKey: ['/api/profile/medical-documents'] });
      
      toast({
        title: t('files.deleteSuccess'),
        description: t('files.deleteSuccessDescription'),
      });
      
      setDocumentToDelete(null);
    },
    onError: (error: Error, documentId: string) => {
      console.error('Error deleting document:', error);
      const documentName = documentToDelete?.name || 'archivo';
      
      setDeleteError({
        documentId,
        documentName,
        error: error.message || t('files.deleteErrorDefault')
      });
      
      setDocumentToDelete(null);
    }
  });

  // Mutation for reprocessing all lab documents
  const reprocessMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/labs/reprocess-all', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labs/analytes'] });
      
      toast({
        title: "Reprocesamiento completado",
        description: `Se procesaron ${data.processed} documentos y se actualizaron ${data.totalAnalytes} analitos con las fechas correctas.`,
      });
    },
    onError: (error: Error) => {
      console.error('Error reprocessing documents:', error);
      toast({
        title: "Error al reprocesar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Query for fetching paginated medical documents
  const { data: documentsData, isLoading, error, refetch } = useQuery<DocumentsResponse>({
    queryKey: ['/api/profile/medical-documents', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await fetch(`/api/profile/medical-documents?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds for LS-102 requirement
  });

  // Handle search submission
  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1); // Reset to first page when searching
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // Handle view document
  const handleViewDocument = async (documentId: string, originalName: string) => {
    try {
      const response = await fetch(`/api/profile/medical-documents/${documentId}/preview`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to preview document');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the object URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Error previewing document:', error);
      toast({
        title: t('common.error'),
        description: t('files.previewError'),
        variant: "destructive",
      });
    }
  };

  // Handle delete document
  const handleDeleteDocument = (documentId: string, originalName: string) => {
    setDocumentToDelete({ id: documentId, name: originalName });
  };

  // Confirm delete document
  const confirmDeleteDocument = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete.id);
    }
  };

  // Retry delete document after error
  const retryDeleteDocument = () => {
    if (deleteError) {
      deleteDocumentMutation.mutate(deleteError.documentId);
      setDeleteError(null);
    }
  };

  // Handle download document
  const handleDownloadDocument = async (documentId: string, originalName: string) => {
    try {
      const response = await fetch(`/api/profile/medical-documents/${documentId}/download`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: t('files.downloadStarted'),
        description: `${t('files.downloading')} ${originalName}`,
      });
      
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: t('common.error'),
        description: t('files.downloadError'),
        variant: "destructive",
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: string): string => {
    const size = parseInt(bytes);
    const units = ['bytes', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  // Get file type badge variant
  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return { text: 'IMG', variant: 'secondary' as const };
    } else if (mimeType === 'application/pdf') {
      return { text: 'PDF', variant: 'default' as const };
    } else if (mimeType.includes('word')) {
      return { text: 'DOC', variant: 'outline' as const };
    }
    return { text: t('files.other'), variant: 'secondary' as const };
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t('files.loadError')}</h3>
              <p className="text-sm">{t('files.loadErrorDescription')}</p>
              <Button onClick={() => refetch()} className="mt-4" data-testid="button-retry">
                {t('common.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t('files.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('files.subtitle')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => reprocessMutation.mutate()}
          disabled={reprocessMutation.isPending}
          data-testid="button-reprocess-labs"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
          {reprocessMutation.isPending ? 'Reprocesando...' : 'Reprocesar Labs'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('files.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Button onClick={handleSearch} data-testid="button-search">
                {t('common.search')}
              </Button>
              {search && (
                <Button variant="outline" onClick={handleClearSearch} data-testid="button-clear-search">
                  {t('common.clear')}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 items-center">
              <Select value={limit.toString()} onValueChange={(value) => {
                setLimit(parseInt(value));
                setPage(1);
              }}>
                <SelectTrigger className="w-32" data-testid="select-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 {t('files.perPageLabel')}</SelectItem>
                  <SelectItem value="20">20 {t('files.perPageLabel')}</SelectItem>
                  <SelectItem value="50">50 {t('files.perPageLabel')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {search && (
            <div className="mt-3 text-sm text-gray-600">
{t('files.showingResultsFor')}: <strong>{search}</strong>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
{t('files.medicalFiles')}
            {documentsData && (
              <Badge variant="secondary" data-testid="text-total-count">
                {documentsData.total} {documentsData.total === 1 ? t('files.totalSingular') : t('files.totalPlural')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : documentsData?.documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">{t('files.noFilesTitle')}</h3>
              <p className="text-gray-600">
                {search ? t('files.noFilesSearch') : t('files.noFilesEmpty')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('files.fileName')}</TableHead>
                      <TableHead>{t('files.fileType')}</TableHead>
                      <TableHead>{t('files.fileSize')}</TableHead>
                      <TableHead>{t('files.uploadDate')}</TableHead>
                      <TableHead className="text-right">{t('files.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentsData?.documents.map((document) => {
                      const fileTypeBadge = getFileTypeBadge(document.mimeType);
                      return (
                        <TableRow key={document.id} data-testid={`row-document-${document.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium" data-testid={`text-filename-${document.id}`}>
                                {document.originalName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fileTypeBadge.variant} data-testid={`badge-type-${document.id}`}>
                              {fileTypeBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-size-${document.id}`}>
                            {formatFileSize(document.fileSize)}
                          </TableCell>
                          <TableCell data-testid={`text-date-${document.id}`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {format(new Date(document.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: language === 'es' ? es : enUS })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDocument(document.id, document.originalName)}
                                data-testid={`button-view-${document.id}`}
                              >
                                <Eye className="h-4 w-4" />
                                {t('common.view')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadDocument(document.id, document.originalName)}
                                data-testid={`button-download-${document.id}`}
                              >
                                <Download className="h-4 w-4" />
                                {t('common.download')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDocument(document.id, document.originalName)}
                                data-testid={`button-delete-${document.id}`}
                                disabled={deleteDocumentMutation.isPending || (documentToDelete?.id === document.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                {documentToDelete?.id === document.id ? "Eliminando..." : "Eliminar"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {documentsData && documentsData.total > documentsData.limit && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600" data-testid="text-pagination-info">
                    Mostrando {((documentsData.page - 1) * documentsData.limit) + 1} a{' '}
                    {Math.min(documentsData.page * documentsData.limit, documentsData.total)} {t('files.showing')}{' '}
                    {documentsData.total} {documentsData.total === 1 ? t('files.filesSingular') : t('files.filesPlural')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1 text-sm">
                      {t('files.pageOf').replace('{current}', documentsData.page.toString()).replace('{total}', Math.ceil(documentsData.total / documentsData.limit).toString())}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!documentsData.hasNext}
                      data-testid="button-next-page"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar el archivo <strong>"{documentToDelete?.name}"</strong>?
              <br />
              <span className="text-red-600 font-medium">Esta acción no se puede deshacer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              disabled={deleteDocumentMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-delete"
            >
              {deleteDocumentMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Error Dialog with Retry Option */}
      <AlertDialog open={!!deleteError} onOpenChange={() => setDeleteError(null)}>
        <AlertDialogContent data-testid="dialog-delete-error">
          <AlertDialogHeader>
            <AlertDialogTitle>Error al eliminar archivo</AlertDialogTitle>
            <AlertDialogDescription>
              No se pudo eliminar el archivo <strong>"{deleteError?.documentName}"</strong>.
              <br />
              <span className="text-gray-600 text-sm mt-2 block">{deleteError?.error}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-dismiss-error">
              Cerrar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={retryDeleteDocument}
              disabled={deleteDocumentMutation.isPending}
              data-testid="button-retry-delete"
            >
              {deleteDocumentMutation.isPending ? "Reintentando..." : "Reintentar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}