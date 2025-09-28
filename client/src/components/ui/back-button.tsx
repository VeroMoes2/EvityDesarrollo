import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useNavigation } from "@/contexts/NavigationContext";
import { useEffect } from "react";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  fallbackPath?: string;
  onBack?: () => void;
}

export function BackButton({
  className,
  variant = "outline",
  size = "default",
  children,
  fallbackPath = "/",
  onBack
}: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }

    // Check if browser has history to go back to
    if (window.history.length > 1) {
      console.log('[BackButton] Using browser history.back(), length:', window.history.length);
      window.history.back();
    } else {
      // Fallback navigation if no history
      console.log('[BackButton] Using fallback path:', fallbackPath, 'history.length:', window.history.length);
      setLocation(fallbackPath);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBackClick}
      className={className}
      data-testid="button-back"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {children || "Regresar"}
    </Button>
  );
}

// Hook for programmatic back navigation
export function useBackNavigation() {
  const [, setLocation] = useLocation();
  const { canGoBack, popState } = useNavigation();

  const goBack = (fallbackPath = "/") => {
    if (canGoBack) {
      const previousState = popState();
      if (previousState) {
        setLocation(previousState.pathname);
        setTimeout(() => {
          if (previousState.scrollPosition) {
            window.scrollTo(0, previousState.scrollPosition);
          }
        }, 100);
        return true;
      }
    }
    
    setLocation(fallbackPath);
    return false;
  };

  return { goBack, canGoBack };
}