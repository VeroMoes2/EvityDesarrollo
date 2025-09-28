import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface NavigationState {
  pathname: string;
  scrollPosition: number;
  activeTab?: string;
  filters?: Record<string, any>;
  menuSection?: string;
}

interface NavigationContextValue {
  navigationHistory: NavigationState[];
  currentState: NavigationState | null;
  pushState: (state: Partial<NavigationState>) => void;
  popState: () => NavigationState | null;
  updateCurrentState: (updates: Partial<NavigationState>) => void;
  canGoBack: boolean;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [navigationHistory, setNavigationHistory] = useState<NavigationState[]>([]);
  const [currentState, setCurrentState] = useState<NavigationState | null>(null);
  const [lastLocation, setLastLocation] = useState<string | null>(null);
  const isNavigatingBackRef = useRef(false);

  // Auto-track navigation changes (but not when navigating back)
  useEffect(() => {
    console.log('[NavigationContext] useEffect - location:', location, 'lastLocation:', lastLocation, 'isNavigatingBack:', isNavigatingBackRef.current);
    
    if (lastLocation && lastLocation !== location && !isNavigatingBackRef.current) {
      // Push the previous location to history when location changes
      const previousState: NavigationState = {
        pathname: lastLocation,
        scrollPosition: 0,
        activeTab: undefined,
        filters: {},
        menuSection: undefined
      };
      
      setNavigationHistory(prev => {
        // Avoid duplicate consecutive states
        const lastState = prev[prev.length - 1];
        if (lastState && lastState.pathname === previousState.pathname) {
          console.log('[NavigationContext] Skipping duplicate state for:', previousState.pathname);
          return prev;
        }
        console.log('[NavigationContext] Auto-pushing state:', previousState);
        return [...prev, previousState];
      });
    } else if (!lastLocation) {
      console.log('[NavigationContext] First location set:', location);
    } else if (lastLocation === location) {
      console.log('[NavigationContext] Same location, no action needed');
    } else if (isNavigatingBackRef.current) {
      console.log('[NavigationContext] Skipping auto-track due to back navigation');
    }
    
    setLastLocation(location);
    
    // Reset back navigation flag after location change
    if (isNavigatingBackRef.current) {
      console.log('[NavigationContext] Resetting back navigation flag');
      isNavigatingBackRef.current = false;
    }
  }, [location, lastLocation]);

  const pushState = useCallback((state: Partial<NavigationState>) => {
    const newState: NavigationState = {
      pathname: location,
      scrollPosition: window.scrollY || 0,
      activeTab: undefined,
      filters: {},
      menuSection: undefined,
      ...state
    };

    setCurrentState(newState);
    console.log('[NavigationContext] Manual pushState:', newState);
  }, [location]);

  const popState = useCallback(() => {
    // Get the last (most recent) state from history
    const previousState = navigationHistory[navigationHistory.length - 1];
    if (previousState) {
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentState(previousState);
      isNavigatingBackRef.current = true; // Flag to prevent auto-tracking interference
      console.log('[NavigationContext] Popping state - setting back nav flag:', previousState);
      return previousState;
    }
    console.log('[NavigationContext] No state to pop, history:', navigationHistory);
    return null;
  }, [navigationHistory]);

  const updateCurrentState = useCallback((updates: Partial<NavigationState>) => {
    if (currentState) {
      const updatedState = { ...currentState, ...updates };
      setCurrentState(updatedState);
      
      // Update the last item in history if it matches current pathname
      setNavigationHistory(prev => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].pathname === updatedState.pathname) {
          const newHistory = [...prev];
          newHistory[lastIndex] = updatedState;
          return newHistory;
        }
        return prev;
      });
    }
  }, [currentState]);

  const clearHistory = useCallback(() => {
    setNavigationHistory([]);
    setCurrentState(null);
  }, []);

  const value: NavigationContextValue = {
    navigationHistory,
    currentState,
    pushState,
    popState,
    updateCurrentState,
    canGoBack: navigationHistory.length > 0,
    clearHistory
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}