import { useQuery } from '@tanstack/react-query';

export interface ConfluenceData {
  mission: string;
  vision: string;
  valueProposition: string;
  companyName: string;
  team?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  // Debug-only fields (only available when SHOW_CONFLUENCE_DEBUG=true)
  availableSpaces?: any[];
  searchResults?: any[];
}

export function useConfluenceData() {
  return useQuery<ConfluenceData>({
    queryKey: ['/api/confluence/content'], // Use consistent cache key
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 1,
  });
}

export function useConfluenceTest() {
  return useQuery({
    queryKey: ['/api/confluence/test'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}