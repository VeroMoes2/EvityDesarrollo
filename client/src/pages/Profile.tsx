import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createNotifications } from "@/lib/notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, logout } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, FileText, Trash2, User, Mail, Calendar, ArrowLeft, Shield, Activity, Download, Eye, Search, Edit, Phone, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema, type UpdateUserProfile, normalizeGender } from "@shared/schema";
import { Link } from "wouter";
import FileUpload from "@/components/FileUpload";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const notifications = createNotifications(t);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // LS-101: Form for profile editing
  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
      gender: normalizeGender((user as any)?.gender) as "masculino" | "femenino" | "otro" | "prefiero_no_decir" | undefined,
      phoneNumber: (user as any)?.phoneNumber || "", // LS-110: Phone number default
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        gender: normalizeGender((user as any)?.gender) as "masculino" | "femenino" | "otro" | "prefiero_no_decir" | undefined,
        phoneNumber: (user as any)?.phoneNumber || "", // LS-110: Phone number reset
      });
    }
  }, [user, form]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      notifications.error.unauthorized();
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading]);

  // Fetch medical documents
  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ["/api/profile/medical-documents"],
    enabled: isAuthenticated,
  });

  // Fetch questionnaire status
  const { data: questionnaireData } = useQuery({
    queryKey: ["/api/questionnaire"],
    enabled: isAuthenticated,
  });

  // Handle documents query error
  if (documentsError && isUnauthorizedError(documentsError)) {
    notifications.error.unauthorized();
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/profile/medical-documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/medical-documents"] });
      notifications.success.documentDeleted();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        notifications.error.unauthorized();
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      notifications.error.networkError();
    },
  });

  // LS-101: Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const response = await apiRequest("PATCH", "/api/profile/update", data);
      return await response.json();
    },
    onSuccess: (response) => {
      // Update auth context with new user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditDialogOpen(false);
      notifications.success.profileUpdated();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        notifications.error.unauthorized();
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Handle validation errors
      if (error?.response?.data?.field) {
        form.setError(error.response.data.field as keyof UpdateUserProfile, {
          message: error.response.data.message
        });
      } else {
        notifications.error.profileUpdateFailed();
      }
    },
  });

  // LS-101: Handle form submission
  const onSubmit = (data: UpdateUserProfile) => {
    // Only send fields that have changed
    const changedData: Partial<UpdateUserProfile> = {};
    
    if (data.firstName !== (user as any)?.firstName) {
      changedData.firstName = data.firstName;
    }
    if (data.lastName !== (user as any)?.lastName) {
      changedData.lastName = data.lastName;
    }
    if (data.email !== (user as any)?.email) {
      changedData.email = data.email;
    }
    if (data.gender !== (user as any)?.gender) {
      changedData.gender = data.gender;
    }
    // LS-110: Check for phone number changes
    if (data.phoneNumber !== (user as any)?.phoneNumber) {
      changedData.phoneNumber = data.phoneNumber;
    }

    // Only submit if there are changes
    if (Object.keys(changedData).length === 0) {
      notifications.info.autoSaved();
      setIsEditDialogOpen(false);
      return;
    }

    updateProfileMutation.mutate(changedData as UpdateUserProfile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const documents = (documentsData as any)?.documents || [];
  
  // Filter documents based on search and type
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = searchTerm === "" || 
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedFileType === "all" || doc.fileType === selectedFileType;
    return matchesSearch && matchesType;
  });
  
  // LS-128: Single unified document section
  const allDocuments = filteredDocuments;

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
                  <span>{t('profile.backHome')}</span>
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('profile.myProfile')}</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              data-testid="button-logout"
            >
              {t('profile.logout')}
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>{t('profile.personalInfo')}</span>
                  </div>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid="button-edit-profile"
                        className="flex items-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>{t('profile.edit')}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" data-testid="dialog-edit-profile">
                      <DialogHeader>
                        <DialogTitle>{t('profile.editTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('profile.editDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('profile.firstName')}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder={t('profile.firstNamePlaceholder')}
                                      data-testid="input-first-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('profile.lastName')}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder={t('profile.lastNamePlaceholder')}
                                      data-testid="input-last-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('profile.email')}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="email"
                                    placeholder={t('profile.emailPlaceholder')}
                                    data-testid="input-email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('profile.gender')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-gender">
                                      <SelectValue placeholder={t('profile.genderPlaceholder')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="prefiero_no_decir">{t('profile.genderPreferNotToSay')}</SelectItem>
                                    <SelectItem value="masculino">{t('profile.genderMale')}</SelectItem>
                                    <SelectItem value="femenino">{t('profile.genderFemale')}</SelectItem>
                                    <SelectItem value="otro">{t('profile.genderOther')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* LS-110: Phone number field */}
                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('profile.phone')}</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field} 
                                      type="tel"
                                      placeholder={t('register.phonePlaceholder')}
                                      data-testid="input-phone-number-profile"
                                      autoComplete="tel"
                                    />
                                    <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsEditDialogOpen(false)}
                              data-testid="button-cancel-edit"
                            >
                              {t('profile.cancel')}
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-profile"
                            >
                              {updateProfileMutation.isPending ? t('common.saving') : t('profile.saveChanges')}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
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
                    {/* LS-110: Display phone number if available */}
                    {(user as any)?.phoneNumber && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="text-sm" data-testid="text-phone-number">{(user as any)?.phoneNumber}</span>
                      </div>
                    )}
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
                    <span className="text-sm" data-testid="verification-status">
                      {(user as any)?.isEmailVerified === "true" ? "Perfil verificado" : "Email pendiente de verificación"}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Activity className="h-4 w-4 mr-2" />
                    <span className="text-sm">{documents.length} documentos cargados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Questionnaire Card */}
            <Card data-testid="card-questionnaire">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardCheck className="h-5 w-5" />
                  <span>Historial Clínico</span>
                </CardTitle>
                <CardDescription>
                  Cuestionario de salud y antecedentes médicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists && 'questionnaire' in questionnaireData && questionnaireData.questionnaire && (questionnaireData.questionnaire as any).isCompleted === "true" ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">
                            Cuestionario completado
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Completado el {new Date((questionnaireData.questionnaire as any).completedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link href="/cuestionario">
                      <Button variant="outline" className="w-full" data-testid="button-view-questionnaire">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver respuestas
                      </Button>
                    </Link>
                  </>
                ) : questionnaireData && typeof questionnaireData === 'object' && 'exists' in questionnaireData && questionnaireData.exists && 'questionnaire' in questionnaireData && questionnaireData.questionnaire && (questionnaireData.questionnaire as any).isCompleted === "false" ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="font-medium text-amber-900 dark:text-amber-100">
                            En progreso
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {Object.keys((questionnaireData.questionnaire as any).answers || {}).length} de 20 preguntas respondidas
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link href="/cuestionario">
                      <Button className="w-full" data-testid="button-continue-questionnaire">
                        <FileText className="h-4 w-4 mr-2" />
                        Continuar cuestionario
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Completa tu historial
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Ayúdanos a conocer mejor tu salud
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link href="/cuestionario">
                      <Button className="w-full" data-testid="button-start-questionnaire">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Iniciar cuestionario
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Medical Documents */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* LS-96-7: Medical Data Privacy Notice */}
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacidad de Datos Médicos:</strong> Tus documentos médicos están protegidos con validaciones de seguridad avanzadas, 
                  límites de acceso y almacenamiento seguro. Solo tú puedes ver y descargar tus documentos. Seguimos buenas prácticas de privacidad.
                </AlertDescription>
              </Alert>

              {/* Search and Filters */}
              <Card data-testid="card-search-filters">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Buscar y Filtrar Documentos</span>
                  </CardTitle>
                  <CardDescription>
                    Encuentra rápidamente tus estudios y laboratorios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar por nombre de archivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                        data-testid="input-search"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                        <SelectTrigger data-testid="select-file-type">
                          <SelectValue placeholder="Tipo de documento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los documentos</SelectItem>
                          <SelectItem value="study">Solo estudios médicos</SelectItem>
                          <SelectItem value="lab">Solo laboratorios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {(searchTerm || selectedFileType !== "all") && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Mostrando {filteredDocuments.length} de {documents.length} documentos
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedFileType("all");
                        }}
                        data-testid="button-clear-filters"
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unified Studies and Labs Section */}
              <Card data-testid="card-studies-labs">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Estudios y Laboratorios</span>
                    <Badge variant="secondary">{allDocuments.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Gestiona todos tus estudios médicos y resultados de laboratorios en un solo lugar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FileUpload 
                    fileType="study" 
                    onUploadSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/profile/medical-documents"] });
                    }}
                    disabled={isLoading}
                  />
                  
                  {documentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Cargando documentos...</p>
                    </div>
                  ) : allDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" data-testid="empty-state-documents">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium mb-2">No tienes estudios o laboratorios cargados</p>
                      <p className="text-sm mb-4">Sube tus primeros documentos médicos para comenzar tu análisis personalizado</p>
                      <Button 
                        onClick={() => (document.querySelector('[data-testid="upload-zone-study"]') as HTMLElement)?.click()}
                        data-testid="button-upload-first-document"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir documento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover-elevate" data-testid={`document-unified-${doc.id}`}>
                          <div className="flex items-center space-x-3">
                            <FileText className={`h-5 w-5 ${doc.fileType === 'study' ? 'text-blue-600' : 'text-green-600'}`} />
                            <div>
                              <p className="font-medium">{doc.originalName}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {doc.fileType === 'study' ? 'Estudio' : 'Laboratorio'}
                                </Badge>
                                {doc.category && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs">{doc.category}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(`/api/profile/medical-documents/${doc.id}/preview`, '_blank')}
                              data-testid={`button-preview-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(`/api/profile/medical-documents/${doc.id}/download`, '_blank')}
                              data-testid={`button-download-${doc.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${doc.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres eliminar "{doc.originalName}"? Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(doc.id)}
                                    data-testid={`button-confirm-delete-${doc.id}`}
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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