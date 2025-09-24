import { toast } from "@/hooks/use-toast"

/**
 * LS-107: Enhanced notification system with specific helpers for different action states
 * Provides contextual notifications for user actions in the Evity platform
 */

type TranslationFunction = (key: string) => string;

export const createNotifications = (t: TranslationFunction) => ({
  // Success notifications for completed actions
  success: {
    login: () =>
      toast({
        variant: "success",
        title: t('notifications.success.loginTitle'),
        description: t('notifications.success.loginDesc'),
      }),
    
    logout: () =>
      toast({
        variant: "success", 
        title: t('notifications.success.logoutTitle'),
        description: t('notifications.success.logoutDesc'),
      }),
    
    profileUpdated: () =>
      toast({
        variant: "success",
        title: t('notifications.success.profileTitle'),
        description: t('notifications.success.profileDesc'),
      }),
    
    documentUploaded: (fileName: string) =>
      toast({
        variant: "success",
        title: t('notifications.success.documentTitle'),
        description: t('notifications.success.documentDesc').replace('{fileName}', fileName),
      }),
    
    documentDeleted: () =>
      toast({
        variant: "success",
        title: t('notifications.success.deleteTitle'),
        description: t('notifications.success.deleteDesc'),
      }),
    
    emailVerified: () =>
      toast({
        variant: "success",
        title: t('notifications.success.emailTitle'),
        description: t('notifications.success.emailDesc'),
      }),
    
    passwordReset: () =>
      toast({
        variant: "success",
        title: t('notifications.success.passwordTitle'),
        description: t('notifications.success.passwordDesc'),
      }),
  },

  // Error notifications for failed actions
  error: {
    loginFailed: (message?: string) =>
      toast({
        variant: "destructive",
        title: t('notifications.error.loginTitle'),
        description: message || t('notifications.error.loginDesc'),
      }),
    
    uploadFailed: (fileName?: string) =>
      toast({
        variant: "destructive",
        title: t('notifications.error.uploadTitle'),
        description: fileName 
          ? t('notifications.error.uploadFileDesc').replace('{fileName}', fileName)
          : t('notifications.error.uploadDesc'),
      }),
    
    profileUpdateFailed: () =>
      toast({
        variant: "destructive",
        title: t('notifications.error.profileTitle'),
        description: t('notifications.error.profileDesc'),
      }),
    
    networkError: () =>
      toast({
        variant: "destructive",
        title: t('notifications.error.networkTitle'),
        description: t('notifications.error.networkDesc'),
      }),
    
    unauthorized: () =>
      toast({
        variant: "destructive",
        title: t('notifications.error.unauthorizedTitle'),
        description: t('notifications.error.unauthorizedDesc'),
      }),
    
    validationError: (field: string) =>
      toast({
        variant: "destructive",
        title: t('notifications.error.validationTitle'),
        description: t('notifications.error.validationDesc').replace('{field}', field),
      }),
  },

  // Info notifications for informational messages
  info: {
    sessionExpiring: (minutes: number) =>
      toast({
        variant: "info",
        title: t('notifications.info.sessionTitle'),
        description: t('notifications.info.sessionDesc').replace('{minutes}', minutes.toString()),
      }),
    
    documentProcessing: () =>
      toast({
        variant: "info",
        title: t('notifications.info.processingTitle'),
        description: t('notifications.info.processingDesc'),
      }),
    
    featureComingSoon: (feature: string) =>
      toast({
        variant: "info",
        title: t('notifications.info.comingSoonTitle'),
        description: t('notifications.info.comingSoonDesc').replace('{feature}', feature),
      }),
    
    autoSaved: () =>
      toast({
        variant: "info",
        title: t('notifications.info.autoSaveTitle'),
        description: t('notifications.info.autoSaveDesc'),
      }),
  },

  // Warning notifications for important alerts
  warning: {
    sessionTimeout: () =>
      toast({
        variant: "warning",
        title: t('notifications.warning.timeoutTitle'),
        description: t('notifications.warning.timeoutDesc'),
      }),
    
    unsavedChanges: () =>
      toast({
        variant: "warning",
        title: t('notifications.warning.unsavedTitle'),
        description: t('notifications.warning.unsavedDesc'),
      }),
    
    storageLimit: () =>
      toast({
        variant: "warning",
        title: t('notifications.warning.storageTitle'),
        description: t('notifications.warning.storageDesc'),
      }),
    
    documentLimit: () =>
      toast({
        variant: "warning",
        title: t('notifications.warning.docLimitTitle'),
        description: t('notifications.warning.docLimitDesc'),
      }),
  },

  // Generic notification helpers
  custom: (variant: "default" | "destructive" | "success" | "warning" | "info", title: string, description?: string) =>
    toast({
      variant,
      title,
      description,
    }),
});

// All components must use createNotifications(t) for proper internationalization
// No fallback export to ensure all text is properly translated

export default createNotifications;