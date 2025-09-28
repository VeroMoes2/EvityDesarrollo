import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

  const pushState = useCallback((state: Partial<NavigationState>) => {
    const newState: NavigationState = {
      pathname: location,
      scrollPosition: window.scrollY || 0,
      activeTab: undefined,
      filters: {},
      menuSection: undefined,
      ...state
    };

    setNavigationHistory(prev => {
      // Avoid pushing duplicate consecutive states
      const lastState = prev[prev.length - 1];
      if (lastState && lastState.pathname === newState.pathname) {
        return [...prev.slice(0, -1), newState];
      }
      return [...prev, newState];
    });

    setCurrentState(newState);
  }, [location]);

  const popState = useCallback(() => {
    const [previousState, ...rest] = navigationHistory.slice(-1);
    if (previousState) {
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentState(previousState);
      return previousState;
    }
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