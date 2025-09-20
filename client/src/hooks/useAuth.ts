import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          // 401 is a valid state (not authenticated), return null
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Auth fetch error:", error);
        return null;
      }
    },
    retry: 1, // Allow one retry
    staleTime: 0, // Always refetch to ensure fresh auth state
    gcTime: 0, // Don't cache auth state for too long
    refetchOnWindowFocus: true, // Refetch when window gains focus (after login)
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  // Refetch auth status when page becomes visible (after login redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  // Force refresh auth state periodically to catch session changes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch, // Expose refetch for manual refresh
  };
}