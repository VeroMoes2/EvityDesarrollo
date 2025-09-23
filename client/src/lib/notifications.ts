import { toast } from "@/hooks/use-toast"

/**
 * LS-107: Enhanced notification system with specific helpers for different action states
 * Provides contextual notifications for user actions in the Evity platform
 */

export const notifications = {
  // Success notifications for completed actions
  success: {
    login: () =>
      toast({
        variant: "success",
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      }),
    
    logout: () =>
      toast({
        variant: "success", 
        title: "Sesión cerrada",
        description: "Has cerrado sesión de forma segura.",
      }),
    
    profileUpdated: () =>
      toast({
        variant: "success",
        title: "Perfil actualizado",
        description: "Tu información personal se ha guardado correctamente.",
      }),
    
    documentUploaded: (fileName: string) =>
      toast({
        variant: "success",
        title: "Documento subido",
        description: `${fileName} se ha subido exitosamente.`,
      }),
    
    documentDeleted: () =>
      toast({
        variant: "success",
        title: "Documento eliminado",
        description: "El documento ha sido eliminado correctamente.",
      }),
    
    emailVerified: () =>
      toast({
        variant: "success",
        title: "Email verificado",
        description: "Tu dirección de email ha sido confirmada.",
      }),
    
    passwordReset: () =>
      toast({
        variant: "success",
        title: "Contraseña restablecida",
        description: "Tu contraseña ha sido actualizada exitosamente.",
      }),
  },

  // Error notifications for failed actions
  error: {
    loginFailed: (message?: string) =>
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: message || "Credenciales incorrectas. Intenta nuevamente.",
      }),
    
    uploadFailed: (fileName?: string) =>
      toast({
        variant: "destructive",
        title: "Error al subir archivo",
        description: fileName 
          ? `No se pudo subir ${fileName}. Verifica el formato y tamaño.`
          : "No se pudo subir el archivo. Intenta nuevamente.",
      }),
    
    profileUpdateFailed: () =>
      toast({
        variant: "destructive",
        title: "Error al actualizar perfil",
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
      }),
    
    networkError: () =>
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "Verifica tu conexión a internet e intenta nuevamente.",
      }),
    
    unauthorized: () =>
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Inicia sesión nuevamente.",
      }),
    
    validationError: (field: string) =>
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: `Por favor verifica el campo: ${field}`,
      }),
  },

  // Info notifications for informational messages
  info: {
    sessionExpiring: (minutes: number) =>
      toast({
        variant: "info",
        title: "Sesión por expirar",
        description: `Tu sesión expirará en ${minutes} minutos.`,
      }),
    
    documentProcessing: () =>
      toast({
        variant: "info",
        title: "Procesando documento",
        description: "Tu documento está siendo analizado. Te notificaremos cuando esté listo.",
      }),
    
    featureComingSoon: (feature: string) =>
      toast({
        variant: "info",
        title: "Próximamente",
        description: `La función ${feature} estará disponible pronto.`,
      }),
    
    autoSaved: () =>
      toast({
        variant: "info",
        title: "Guardado automático",
        description: "Tus cambios han sido guardados automáticamente.",
      }),
  },

  // Warning notifications for important alerts
  warning: {
    sessionTimeout: () =>
      toast({
        variant: "warning",
        title: "Advertencia de sesión",
        description: "Tu sesión está por expirar. Guarda tu trabajo.",
      }),
    
    unsavedChanges: () =>
      toast({
        variant: "warning",
        title: "Cambios sin guardar",
        description: "Tienes cambios sin guardar. ¿Deseas continuar?",
      }),
    
    storageLimit: () =>
      toast({
        variant: "warning",
        title: "Límite de almacenamiento",
        description: "Estás cerca del límite de almacenamiento. Considera eliminar archivos antiguos.",
      }),
    
    documentLimit: () =>
      toast({
        variant: "warning",
        title: "Límite de documentos",
        description: "Has alcanzado el límite de documentos. Elimina algunos para subir más.",
      }),
  },

  // Generic notification helpers
  custom: (variant: "default" | "destructive" | "success" | "warning" | "info", title: string, description?: string) =>
    toast({
      variant,
      title,
      description,
    }),
}

export default notifications