import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

const getToastIcon = (variant?: string) => {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
    case "destructive":
      return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    case "info":
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    default:
      return null
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getToastIcon(variant || "default")
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start space-x-3">
              {icon && (
                <div className="flex-shrink-0 mt-0.5">
                  {icon}
                </div>
              )}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
