import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Get response body as text first (can only read once)
    const responseText = await res.text();
    console.log("DEBUG Response text:", responseText);
    
    try {
      // Try to parse as JSON to preserve error fields
      const errorData = JSON.parse(responseText);
      console.log("DEBUG Parsed JSON:", errorData);
      // Create error with JSON fields preserved
      const error = new Error(errorData.message || `HTTP ${res.status}`);
      // Preserve additional fields from server response for better error handling
      Object.assign(error, errorData);
      console.log("DEBUG Final error object with fields:", error, "field:", error.field);
      throw error;
    } catch (parseError) {
      // Fallback to text if JSON parsing fails
      console.log("DEBUG JSON parse failed:", parseError);
      throw new Error(`${res.status}: ${responseText || res.statusText}`);
    }
  }
}

/**
 * Fetch CSRF token from server
 * LS-108: Required for secure state-changing operations
 */
async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", {
    method: "GET",
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token: ${res.status}`);
  }
  
  const data = await res.json();
  return data.csrfToken;
}

/**
 * Enhanced apiRequest with automatic CSRF token handling
 * LS-108: Automatically includes CSRF tokens for state-changing operations
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // LS-108: Add CSRF token for state-changing methods
  const needsCsrfToken = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  if (needsCsrfToken) {
    try {
      const csrfToken = await fetchCsrfToken();
      headers['x-csrf-token'] = csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      throw error;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Upload helper with automatic CSRF token handling for FormData
 * LS-108: Handles file uploads with proper CSRF token inclusion
 */
export async function uploadWithCsrf(
  url: string,
  formData: FormData,
): Promise<Response> {
  try {
    // LS-108: Get CSRF token for upload security
    const csrfToken = await fetchCsrfToken();
    
    // Add CSRF token to FormData
    formData.append('csrfToken', csrfToken);
    
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
