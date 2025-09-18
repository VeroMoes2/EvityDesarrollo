import { useQuery } from '@tanstack/react-query';

export interface ConfluenceData {
  mission: string;
  vision: string;
  valueProposition: string;
  companyName: string;
  // Debug-only fields (only available when SHOW_CONFLUENCE_DEBUG=true)
  availableSpaces?: any[];
  searchResults?: any[];
}

export function useConfluenceData() {
  return useQuery<ConfluenceData>({
    queryKey: ['/api/confluence/content', Date.now()], // Force fresh requests every time
    staleTime: 0, // No cache - always fresh data
    cacheTime: 0, // Don't store in cache
    refetchOnMount: true,
    retry: 2,
  });
}

export function useConfluenceTest() {
  return useQuery({
    queryKey: ['/api/confluence/test'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}