import { useQuery } from '@tanstack/react-query';

export interface ConfluenceData {
  businessPlan: any;
  propuestaIntegral: any;
  mission: string;
  vision: string;
  valueProposition: string;
  companyName: string;
  availableSpaces: any[];
  searchResults: any[];
}

export function useConfluenceData() {
  return useQuery<ConfluenceData>({
    queryKey: ['/api/confluence/content'],
    staleTime: 0, // No cache - always fresh data
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