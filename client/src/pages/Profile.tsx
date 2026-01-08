import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createNotifications } from "@/lib/notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, logout } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  FileText,
  Trash2,
  User,
  Mail,
  Calendar,
  ArrowLeft,
  Shield,
  Activity,
  Download,
  Eye,
  Search,
  Edit,
  Phone,
  ClipboardCheck,
  CheckCircle2,
  Bot,
  Sparkles,
  RotateCcw,
  FlaskConical,
  LayoutDashboard,
  TestTube,
  Watch,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  ChevronUp,
  ChevronDown,
  History,
  Target,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserProfileSchema,
  type UpdateUserProfile,
  normalizeGender,
} from "@shared/schema";
import FileUpload from "@/components/FileUpload";

type ProfileSection = "perfil" | "citas" | "dashboard" | "plan-longevity" | "historia" | "historial-clinico" | "laboratorios" | "dispositivos" | "configuracion" | "ayuda";

interface LabAnalyteType {
  id: string;
  analyteName: string;
  valueNumeric: string;
  unit: string;
  referenceMin: string | null;
  referenceMax: string | null;
  referenceText: string | null;
  collectedAt: string | null;
}

function StatusDot({ status }: { status: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500"
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]} flex-shrink-0`} />;
}

function AnalyteRowComponent({ 
  analyte, 
  getStatusColor,
  formatRange 
}: { 
  analyte: LabAnalyteType;
  getStatusColor: (value: string, min: string | null, max: string | null) => "green" | "yellow" | "red";
  formatRange: (min: string | null, max: string | null, unit: string) => string;
}) {
  const status = getStatusColor(analyte.valueNumeric, analyte.referenceMin, analyte.referenceMax);
  const rangeText = formatRange(analyte.referenceMin, analyte.referenceMax, analyte.unit);
  
  const statusTextColors = {
    green: "text-green-500",
    yellow: "text-yellow-500", 
    red: "text-red-500"
  };
  
  return (
    <Link 
      href={`/analito/${encodeURIComponent(analyte.analyteName)}`}
      className="flex items-center justify-between py-3.5 px-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
      data-testid={`link-analyte-${analyte.analyteName.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex-1">
        <div className="font-semibold text-foreground">{analyte.analyteName}</div>
        {rangeText && (
          <div className="text-xs text-muted-foreground mt-0.5">{rangeText}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-xl ${statusTextColors[status]}`}>
          {analyte.valueNumeric}
        </span>
        <StatusDot status={status} />
      </div>
    </Link>
  );
}

function CategoryCardComponent({ 
  category, 
  analytes,
  getStatusColor,
  formatRange,
  defaultOpen = true
}: { 
  category: string; 
  analytes: LabAnalyteType[];
  getStatusColor: (value: string, min: string | null, max: string | null) => "green" | "yellow" | "red";
  formatRange: (min: string | null, max: string | null, unit: string) => string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (analytes.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-border overflow-hidden" data-testid={`category-card-${category.replace(/\s+/g, '-').toLowerCase()}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between py-4 px-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border">
            <span className="text-base font-semibold text-foreground">{category}</span>
            {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y divide-border">
            {analytes.map((analyte) => (
              <AnalyteRowComponent 
                key={analyte.id} 
                analyte={analyte} 
                getStatusColor={getStatusColor}
                formatRange={formatRange}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const notifications = createNotifications(t);
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<ProfileSection>("perfil");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [selectedDocCategory, setSelectedDocCategory] = useState<"all" | "lab" | "study">("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [analyteSearchQuery, setAnalyteSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDarkMode = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
      gender: normalizeGender((user as any)?.gender) as
        | "masculino"
        | "femenino"
        | "otro"
        | "prefiero_no_decir"
        | undefined,
      phoneNumber: (user as any)?.phoneNumber || "",
      dateOfBirth: (user as any)?.dateOfBirth || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        gender: normalizeGender((user as any)?.gender) as
          | "masculino"
          | "femenino"
          | "otro"
          | "prefiero_no_decir"
          | undefined,
        phoneNumber: (user as any)?.phoneNumber || "",
        dateOfBirth: (user as any)?.dateOfBirth || "",
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      notifications.error.unauthorized();
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading]);

  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ["/api/profile/medical-documents"],
    enabled: isAuthenticated,
  });

  const { data: questionnaireData } = useQuery<any>({
    queryKey: ["/api/questionnaire"],
    enabled: isAuthenticated,
  });

  const { data: latestResultResponse } = useQuery<any>({
    queryKey: ["/api/questionnaire-results/latest"],
    enabled: isAuthenticated,
  });
  
  const latestResultData = latestResultResponse?.result;

  interface LabAnalyte {
    id: string;
    analyteName: string;
    valueNumeric: string;
    unit: string;
    referenceMin: string | null;
    referenceMax: string | null;
    referenceText: string | null;
    collectedAt: string | null;
  }

  const { data: analytesData, isLoading: analytesLoading } = useQuery<{ analytes: LabAnalyte[] }>({
    queryKey: ["/api/labs/analytes/latest"],
    enabled: isAuthenticated,
  });

  const ANALYTE_CATEGORIES: Record<string, string[]> = {
    "Panel Metabólico Básico": [
      "Glucosa", "Glucosa en Ayunas", "Sodio", "Potasio", "Cloro", "Calcio", 
      "Magnesio", "Fósforo", "Bicarbonato", "CO2", "Hierro", "Ferritina"
    ],
    "Panel Lipídico": [
      "Colesterol Total", "Colesterol", "Colesterol HDL", "HDL", 
      "Colesterol LDL", "LDL", "Triglicéridos", "VLDL"
    ],
    "Hemograma Completo": [
      "Hemoglobina", "Hematocrito", "Eritrocitos", "Leucocitos", "Plaquetas",
      "VCM", "HCM", "CHCM", "VPM", "RDW", "Neutrófilos", "Linfocitos"
    ],
    "Panel Tiroideo": [
      "TSH", "T3", "T3 Libre", "T4", "T4 Libre", "T3 Total", "T4 Total"
    ],
    "Función Hepática": [
      "ALT", "AST", "TGO", "TGP", "GGT", "Fosfatasa Alcalina", "ALP",
      "Bilirrubina Total", "Bilirrubina Directa", "Bilirrubina Indirecta",
      "Albúmina", "Proteínas Totales"
    ],
    "Función Renal": [
      "Creatinina", "BUN", "Urea", "Ácido Úrico", "TFG", "Cistatina C"
    ],
    "Hormonas": [
      "Cortisol", "Testosterona", "Estradiol", "Progesterona", "FSH", "LH",
      "Prolactina", "DHEA", "DHEA-S", "IGF-1", "Insulina", "HbA1c"
    ],
    "Vitaminas y Minerales": [
      "Vitamina D", "Vitamina D3", "25-OH Vitamina D", "Vitamina B12",
      "Vitamina B9", "Ácido Fólico", "Folato", "Vitamina A", "Vitamina E",
      "Zinc", "Cobre", "Selenio"
    ],
    "Otros Análisis": []
  };

  const categorizeAnalyte = (analyteName: string): string => {
    const lowerName = analyteName.toLowerCase();
    for (const [category, analytes] of Object.entries(ANALYTE_CATEGORIES)) {
      if (category === "Otros Análisis") continue;
      if (analytes.some(a => 
        lowerName.includes(a.toLowerCase()) || 
        a.toLowerCase().includes(lowerName) ||
        lowerName === a.toLowerCase()
      )) {
        return category;
      }
    }
    return "Otros Análisis";
  };

  const getStatusColor = (value: string, min: string | null, max: string | null): "green" | "yellow" | "red" => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "green";
    
    const numMin = min ? parseFloat(min) : null;
    const numMax = max ? parseFloat(max) : null;
    
    if (numMin !== null && numMax !== null) {
      if (numValue >= numMin && numValue <= numMax) {
        return "green";
      }
      const deviation = numValue < numMin 
        ? (numMin - numValue) / numMin 
        : (numValue - numMax) / numMax;
      return deviation > 0.15 ? "red" : "yellow";
    }
    
    if (numMin !== null && numValue < numMin) {
      const deviation = (numMin - numValue) / numMin;
      return deviation > 0.15 ? "red" : "yellow";
    }
    if (numMax !== null && numValue > numMax) {
      const deviation = (numValue - numMax) / numMax;
      return deviation > 0.15 ? "red" : "yellow";
    }
    
    return "green";
  };

  const formatRange = (min: string | null, max: string | null, unit: string): string => {
    if (min !== null && max !== null) return `${min}-${max} ${unit}`;
    if (min !== null) return `>${min} ${unit}`;
    if (max !== null) return `<${max} ${unit}`;
    return "";
  };

  const categorizedAnalytes = (() => {
    if (!analytesData?.analytes) return {};
    
    const filtered = analyteSearchQuery 
      ? analytesData.analytes.filter(a => 
          a.analyteName.toLowerCase().includes(analyteSearchQuery.toLowerCase())
        )
      : analytesData.analytes;
    
    const grouped: Record<string, LabAnalyte[]> = {};
    
    for (const analyte of filtered) {
      const category = categorizeAnalyte(analyte.analyteName);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(analyte);
    }
    
    return grouped;
  })();

  const categoryOrder = [
    "Panel Metabólico Básico",
    "Panel Lipídico", 
    "Hemograma Completo",
    "Panel Tiroideo",
    "Función Hepática",
    "Función Renal",
    "Hormonas",
    "Vitaminas y Minerales",
    "Otros Análisis"
  ];

  if (documentsError && isUnauthorizedError(documentsError)) {
    notifications.error.unauthorized();
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest(
        "DELETE",
        `/api/profile/medical-documents/${documentId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/profile/medical-documents"],
      });
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const response = await apiRequest("PATCH", "/api/profile/update", data);
      return await response.json();
    },
    onSuccess: (response) => {
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

      if (error?.response?.data?.field) {
        form.setError(error.response.data.field as keyof UpdateUserProfile, {
          message: error.response.data.message,
        });
      } else {
        notifications.error.profileUpdateFailed();
      }
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const csrfResponse = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!csrfResponse.ok) {
        throw new Error("No se pudo obtener el token de seguridad");
      }

      const { csrfToken } = await csrfResponse.json();

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al subir la imagen");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsUploadingImage(false);
      toast({
        title: "Imagen actualizada",
        description: "Tu foto de perfil se ha actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      setIsUploadingImage(false);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten imágenes (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no puede superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    uploadImageMutation.mutate(file);
  };

  const onSubmit = (data: UpdateUserProfile) => {
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
    if (data.phoneNumber !== (user as any)?.phoneNumber) {
      changedData.phoneNumber = data.phoneNumber;
    }

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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            {t("profile.loadingProfile")}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const documents = (documentsData as any)?.documents || [];

  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch =
      searchTerm === "" ||
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedFileType === "all" || doc.fileType === selectedFileType;
    const matchesCategory =
      selectedDocCategory === "all" || doc.fileType === selectedDocCategory;
    return matchesSearch && matchesType && matchesCategory;
  });
  
  const labDocsCount = documents.filter((doc: any) => doc.fileType === "lab").length;
  const studyDocsCount = documents.filter((doc: any) => doc.fileType === "study").length;

  const sectionScores = latestResultData?.sectionScores || {};
  const pillars = [
    { key: "Alcohol", label: "Alcohol" },
    { key: "Tabaquismo", label: "Tabaquismo" },
    { key: "Salud mental", label: "Salud mental" },
    { key: "Sueño y descanso", label: "Sueño y descanso" },
    { key: "Dieta y nutrición", label: "Dieta y nutrición" },
    { key: "Enfermedades crónicas", label: "Enfermedades crónicas" },
    { key: "Apoyo social y propósito", label: "Apoyo social" },
    { key: "Cognición y funcionalidad", label: "Cognición y funcionalidad" },
    { key: "Peso e índice de masa corporal", label: "Peso e IMC" },
    { key: "Actividad física y sedentarismo", label: "Actividad física" },
  ];

  const memberSince = (user as any)?.createdAt 
    ? new Date((user as any).createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const menuItems = [
    { id: "perfil" as ProfileSection, label: "Mi perfil", icon: User },
    { id: "plan-longevity" as ProfileSection, label: "Mi plan Evity", icon: Target },
    { id: "dispositivos" as ProfileSection, label: "Mis dispositivos", icon: Watch },
    { id: "dashboard" as ProfileSection, label: "Mi avance", icon: LayoutDashboard },
    { id: "historia" as ProfileSection, label: "Mi historia", icon: History },
    { id: "citas" as ProfileSection, label: "Mis citas", icon: Calendar },
    { id: "historial-clinico" as ProfileSection, label: "Historial clínico", icon: FileText },
    { id: "laboratorios" as ProfileSection, label: "Estudios y laboratorios", icon: Upload },
  ];

  const footerItems = [
    { id: "configuracion" as ProfileSection, label: "Configuración", icon: Settings },
    { id: "ayuda" as ProfileSection, label: "Ayuda", icon: HelpCircle },
  ];

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={(user as any)?.profileImageUrl} alt="Perfil" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(user as any)?.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">
                {(user as any)?.firstName || 'Usuario'}
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full justify-start gap-3"
                        data-testid={`sidebar-${item.id}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-2">
            <Separator className="my-2" />
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    isActive={activeSection === item.id}
                    className="w-full justify-start gap-3"
                    data-testid={`sidebar-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                  data-testid="sidebar-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="p-6 lg:p-10">
            {activeSection === "perfil" && (
              <div className="space-y-8">
                <div>
                  <h1 
                    className="text-4xl lg:text-5xl font-light text-foreground mb-2"
                    style={{ fontFamily: "'Lovelace Light', serif" }}
                    data-testid="profile-title"
                  >
                    Tu Perfil
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Miembro desde {memberSince}</span>
                  </div>
                </div>

                <Card className="border border-border mb-6" data-testid="card-personal-info">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Nombre completo</p>
                        <p className="font-medium text-foreground">
                          {(user as any)?.firstName} {(user as any)?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Fecha de nacimiento</p>
                        <p className="font-medium text-foreground">
                          {(user as any)?.dateOfBirth 
                            ? new Date((user as any).dateOfBirth).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Lugar de nacimiento</p>
                        <p className="font-medium text-foreground">
                          {(user as any)?.birthPlace || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Residencia actual</p>
                        <p className="font-medium text-foreground">
                          {(user as any)?.currentResidence || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sexo</p>
                        <p className="font-medium text-foreground capitalize">
                          {(user as any)?.gender === 'masculino' ? 'Masculino' 
                            : (user as any)?.gender === 'femenino' ? 'Femenino'
                            : (user as any)?.gender === 'otro' ? 'Otro'
                            : (user as any)?.gender === 'prefiero_no_decir' ? 'Prefiero no decir'
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border border-border" data-testid="card-biological-age">
                    <CardContent className="pt-6">
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground">Mi edad biológica</h3>
                        <p className="text-sm text-muted-foreground">Tu edad en años</p>
                      </div>
                      <div className="mt-6 flex items-baseline gap-2">
                        <span 
                          className="text-4xl font-light text-foreground"
                          style={{ fontFamily: "'Lovelace Light', serif" }}
                        >
                          {(user as any)?.dateOfBirth 
                            ? Math.floor((Date.now() - new Date((user as any).dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                            : '—  —'}
                        </span>
                        {(user as any)?.dateOfBirth && (
                          <span className="text-lg text-muted-foreground">años</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border" data-testid="card-longevity-points">
                    <CardContent className="pt-6">
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground">Puntos Evity</h3>
                        <p className="text-sm text-muted-foreground">Puntaje de longevidad</p>
                      </div>
                      <div className="mt-6">
                        <span 
                          className="text-4xl font-light text-foreground"
                          style={{ fontFamily: "'Lovelace Light', serif" }}
                        >
                          {latestResultData?.longevityPoints ? `${Math.round(latestResultData.longevityPoints)}` : '—  —'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {latestResultData?.healthStatus && (
                  <Card className="border border-border bg-muted/30" data-testid="card-health-status">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex flex-col items-center">
                            <p className="text-xs text-muted-foreground">Puntos</p>
                            <p className="text-xs text-muted-foreground">Evity</p>
                            <p 
                              className="text-2xl font-bold text-primary"
                              style={{ fontFamily: "'Lovelace Light', serif" }}
                            >
                              {latestResultData.longevityPoints ? Math.round(latestResultData.longevityPoints) : 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 border-l border-border pl-4">
                          <p className="text-xs text-muted-foreground mb-1">Estado de salud</p>
                          <p className="font-medium text-foreground">{latestResultData.healthStatus}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === "citas" && (
              <div className="space-y-8">
                {/* Header with icon */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h1 
                    className="text-2xl lg:text-3xl font-semibold text-foreground"
                  >
                    Agendar entrevista: Mi primer contacto
                  </h1>
                  <p className="text-muted-foreground">
                    Selecciona el mejor horario para tu consulta
                  </p>
                </div>

                {/* Duration and Pre-loaded Info Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border border-border">
                    <CardContent className="py-6">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-foreground">Duración de la consulta</h3>
                          <p className="text-primary text-xl font-medium mt-1">30 minutos</p>
                          <p className="text-muted-foreground text-sm mt-1">
                            Primera consulta para conocer tus objetivos de salud y longevidad
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border">
                    <CardContent className="py-6">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-foreground">Información pre-cargada</h3>
                          <p className="text-muted-foreground text-sm mt-1">Tu información ya está lista:</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-foreground text-sm">
                              <span className="font-medium">Nombre:</span> {(user as any)?.firstName} {(user as any)?.lastName}
                            </p>
                            <p className="text-foreground text-sm">
                              <span className="font-medium">Email:</span> {(user as any)?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Calendar Button Card */}
                <Card className="border border-border">
                  <CardContent className="py-8 text-center space-y-4">
                    <p className="text-muted-foreground">
                      Haz clic en el botón para abrir el calendario y seleccionar tu horario preferido
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => window.open('https://calendly.com/elena-evity/30min', '_blank', 'noopener,noreferrer')}
                      data-testid="button-agendar-cita"
                      className="gap-2"
                    >
                      <Calendar className="h-5 w-5" />
                      Abrir Calendario de Citas
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Se abrirá en una nueva pestaña
                    </p>
                  </CardContent>
                </Card>

                {/* What to Expect Section */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">¿Qué esperar de tu primera consulta?</h2>
                    <p className="text-muted-foreground text-sm">Te prepararemos para una experiencia productiva</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-foreground">Evaluación inicial</h3>
                        <p className="text-muted-foreground text-sm">Revisaremos tu estado de salud actual y objetivos de longevidad</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-foreground">Platiquemos sobre Evity</h3>
                        <p className="text-muted-foreground text-sm">Te brindaremos toda la información que necesitas saber sobre Evity</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-foreground">Próximos pasos</h3>
                        <p className="text-muted-foreground text-sm">Te guiaremos en tu camino hacia una vida más larga y saludable</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h1 
                    className="text-4xl lg:text-5xl font-light text-foreground"
                    style={{ fontFamily: "'Lovelace Light', serif" }}
                  >
                    Mi avance
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Revisa tus últimos análisis de laboratorio.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar analito..."
                    value={analyteSearchQuery}
                    onChange={(e) => setAnalyteSearchQuery(e.target.value)}
                    className="pl-11 h-11"
                    data-testid="input-search-analyte"
                  />
                </div>

                {analytesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !analytesData?.analytes || analytesData.analytes.length === 0 ? (
                  <Card className="border border-border">
                    <CardContent className="py-12 text-center">
                      <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Sin resultados aún</h3>
                      <p className="text-muted-foreground mb-4">
                        Sube tus análisis de laboratorio para ver tus resultados aquí
                      </p>
                      <Button onClick={() => setActiveSection("laboratorios")} data-testid="button-upload-labs">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Laboratorios
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {categoryOrder.map((category) => {
                      const analytes = categorizedAnalytes[category];
                      if (!analytes || analytes.length === 0) return null;
                      
                      return (
                        <CategoryCardComponent 
                          key={category}
                          category={category}
                          analytes={analytes}
                          getStatusColor={getStatusColor}
                          formatRange={formatRange}
                        />
                      );
                    })}
                    
                  </div>
                )}
              </div>
            )}

            {activeSection === "plan-longevity" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Mi plan Evity
                </h1>
                <p className="text-muted-foreground">
                  Próximamente: Tu plan personalizado para una vida más larga y saludable.
                </p>
              </div>
            )}

            {activeSection === "historia" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Mi historia
                </h1>
                <p className="text-muted-foreground mb-4">
                  Consulta tu historial de evaluaciones y cuestionarios.
                </p>

                {latestResultData ? (
                  <>
                    <Card className="border border-border" data-testid="card-questionnaire-status">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardCheck className="h-5 w-5" />
                          Cuestionario de longevidad
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Cuestionario completado</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Puntos de Longevidad</p>
                              <p className="text-3xl font-bold text-primary" style={{ fontFamily: "'Lovelace Light', serif" }}>
                                {latestResultData.longevityPoints ? Math.round(latestResultData.longevityPoints) : 0}
                              </p>
                            </div>
                            {latestResultData.healthStatus && (
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Estado de salud</p>
                                <p className="font-medium text-foreground">{latestResultData.healthStatus}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => navigate('/cuestionario-resultados')} data-testid="button-view-results">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver resultados completos
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate('/cuestionario')} data-testid="button-retake-questionnaire">
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Repetir cuestionario
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {latestResultData.personalizedSummary && (
                      <Card className="border border-border" data-testid="card-personalized-summary">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Tu perfil de bienestar personalizado
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Análisis generado por IA basado en tus respuestas
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted/30 rounded-lg p-4">
                            <p className="text-sm leading-relaxed text-foreground">
                              {latestResultData.personalizedSummary}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="border border-border" data-testid="card-pillar-scores">
                      <CardHeader>
                        <CardTitle 
                          className="text-2xl font-light"
                          style={{ fontFamily: "'Lovelace Light', serif" }}
                        >
                          Score por pilar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          {pillars.map((pillar) => {
                            const score = sectionScores[pillar.key] !== undefined ? Math.round(sectionScores[pillar.key]) : 0;
                            const getScoreColor = (s: number) => {
                              if (s >= 80) return "text-green-600 dark:text-green-400";
                              if (s >= 60) return "text-yellow-600 dark:text-yellow-400";
                              return "text-orange-600 dark:text-orange-400";
                            };
                            const getBarColor = (s: number) => {
                              if (s >= 80) return "bg-green-600";
                              if (s >= 60) return "bg-yellow-600";
                              return "bg-orange-600";
                            };
                            return (
                              <div 
                                key={pillar.key}
                                className="py-3 px-4 rounded-md border border-border bg-muted/30"
                                data-testid={`pillar-${pillar.key}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="font-normal bg-background">
                                    {pillar.label}
                                  </Badge>
                                  <span className={`font-semibold ${getScoreColor(score)}`}>
                                    {score}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${getBarColor(score)}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {latestResultData.sectionInterpretations && Object.keys(latestResultData.sectionInterpretations).length > 0 && (
                      <Card className="border border-border" data-testid="card-section-interpretations">
                        <CardHeader>
                          <CardTitle 
                            className="text-2xl font-light"
                            style={{ fontFamily: "'Lovelace Light', serif" }}
                          >
                            Enfoque en tus resultados
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Recomendaciones personalizadas basadas en tu evaluación
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {Object.entries(latestResultData.sectionInterpretations).map(([section, interpretation]) => (
                            <div key={section} className="space-y-2">
                              <h3 className="text-base font-semibold text-primary">{section}</h3>
                              <div className="bg-muted/30 rounded-lg p-4">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                  {interpretation as string}
                                </p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border border-border" data-testid="card-questionnaire-status">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Cuestionario de longevidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Completa el cuestionario para conocer tu perfil de longevidad y recibir recomendaciones personalizadas.
                        </p>
                        <Button onClick={() => navigate('/cuestionario')} data-testid="button-start-questionnaire">
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Comenzar cuestionario
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === "historial-clinico" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Historial clínico
                </h1>
                <p className="text-muted-foreground mb-4">
                  Tu historial médico y clínico.
                </p>

                <Card className="border border-border">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Próximamente</h3>
                    <p className="text-muted-foreground">
                      Aquí podrás ver tu historial clínico completo, incluyendo consultas, diagnósticos y tratamientos.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "laboratorios" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Estudios y laboratorios
                </h1>
                <p className="text-muted-foreground mb-4">
                  Sube tus resultados de laboratorio para análisis automático.
                </p>
                
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Subir documento
                    </CardTitle>
                    <CardDescription>
                      Formatos aceptados: PDF, JPG, PNG. Máximo 10MB.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      onUploadSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/profile/medical-documents"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/labs/analytes/latest"] });
                        toast({
                          title: "Documento subido",
                          description: "Tu documento se ha subido exitosamente.",
                        });
                      }} 
                    />
                  </CardContent>
                </Card>

                {documents.length > 0 && (
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Documentos subidos
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant={selectedDocCategory === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDocCategory("all")}
                            data-testid="filter-all-docs"
                          >
                            Todos ({documents.length})
                          </Button>
                          <Button
                            variant={selectedDocCategory === "lab" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDocCategory("lab")}
                            data-testid="filter-lab-docs"
                          >
                            Laboratorios ({labDocsCount})
                          </Button>
                          <Button
                            variant={selectedDocCategory === "study" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDocCategory("study")}
                            data-testid="filter-study-docs"
                          >
                            Estudios ({studyDocsCount})
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredDocuments.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            No hay documentos en esta categoría
                          </p>
                        ) : filteredDocuments.map((doc: any) => (
                          <div 
                            key={doc.id} 
                            className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{doc.originalName}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    doc.fileType === "lab" 
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  }`}>
                                    {doc.fileType === "lab" ? "Laboratorio" : "Estudio"}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(doc.createdAt).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El documento será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteMutation.mutate(doc.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === "dispositivos" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Mis dispositivos
                </h1>
                <p className="text-muted-foreground">
                  Próximamente: Conecta tus wearables y dispositivos de salud.
                </p>
              </div>
            )}

            {activeSection === "configuracion" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Configuración
                </h1>
                
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Información personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={(user as any)?.profileImageUrl} alt="Perfil" />
                          <AvatarFallback>
                            {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <input
                          type="file"
                          id="profile-image-upload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          data-testid="input-profile-image"
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full"
                          onClick={() => document.getElementById("profile-image-upload")?.click()}
                          disabled={isUploadingImage}
                          data-testid="button-change-photo"
                        >
                          {isUploadingImage ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                          ) : (
                            <Edit className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div>
                        <p className="font-medium">{(user as any)?.firstName} {(user as any)?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
                      </div>
                    </div>

                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" data-testid="button-edit-profile">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar información
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-edit-profile">
                        <DialogHeader>
                          <DialogTitle>{t("profile.editTitle")}</DialogTitle>
                          <DialogDescription>{t("profile.editDescription")}</DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("profile.firstName")}</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder={t("profile.firstNamePlaceholder")} data-testid="input-first-name" />
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
                                    <FormLabel>{t("profile.lastName")}</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder={t("profile.lastNamePlaceholder")} data-testid="input-last-name" />
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
                                  <FormLabel>{t("profile.email")}</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" placeholder={t("profile.emailPlaceholder")} data-testid="input-email" />
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
                                  <FormLabel>{t("profile.gender")}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-gender">
                                        <SelectValue placeholder={t("profile.genderPlaceholder")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="prefiero_no_decir">{t("profile.genderPreferNotToSay")}</SelectItem>
                                      <SelectItem value="masculino">{t("profile.genderMale")}</SelectItem>
                                      <SelectItem value="femenino">{t("profile.genderFemale")}</SelectItem>
                                      <SelectItem value="otro">{t("profile.genderOther")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Fecha de nacimiento</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="date" data-testid="input-date-of-birth-profile" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="phoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("profile.phone")}</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input {...field} type="tel" placeholder={t("register.phonePlaceholder")} data-testid="input-phone-number-profile" autoComplete="tel" />
                                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
                                {t("profile.cancel")}
                              </Button>
                              <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                                {updateProfileMutation.isPending ? t("common.saving") : t("profile.saveChanges")}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "ayuda" && (
              <div className="space-y-6">
                <h1 
                  className="text-4xl lg:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Lovelace Light', serif" }}
                >
                  Ayuda
                </h1>
                <Card className="border border-border">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground mb-4">
                      ¿Tienes preguntas? Estamos aquí para ayudarte.
                    </p>
                    <Button variant="outline" onClick={() => window.open('mailto:soporte@evity.mx', '_blank')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contactar soporte
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
