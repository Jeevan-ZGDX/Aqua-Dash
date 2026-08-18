'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type {
  ApplicationsQuery,
  StudentSearchQuery,
} from '@/types';

export const queryKeys = {
  overview: (year?: string, round?: string) => ['overview', year, round] as const,
  applications: (q: ApplicationsQuery) => ['applications', q] as const,
  analytics: (f: Record<string, string | undefined>) => ['analytics', f] as const,
  seats: (year?: string, round?: string) => ['seats', year, round] as const,
  trends: (year?: string, round?: string) => ['trends', year, round] as const,
  students: (q: StudentSearchQuery) => ['students', q] as const,
  student: (id: string) => ['student', id] as const,
  reports: () => ['reports'] as const,
  hod: (year?: string) => ['hod', year] as const,
  summary: (year?: string) => ['summary', year] as const,
};

export function useOverview(year?: string, round?: string) {
  return useQuery({
    queryKey: queryKeys.overview(year, round),
    queryFn: () => api.getOverview(year, round),
    placeholderData: keepPreviousData,
  });
}

export function useApplications(q: ApplicationsQuery) {
  return useQuery({
    queryKey: queryKeys.applications(q),
    queryFn: () => api.getApplications(q),
    placeholderData: keepPreviousData,
  });
}

export function useAnalytics(filters: { academicYear?: string; round?: string; community?: string; gender?: string }) {
  return useQuery({
    queryKey: queryKeys.analytics(filters),
    queryFn: () => api.getAnalytics(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSeats(year?: string, round?: string) {
  return useQuery({
    queryKey: queryKeys.seats(year, round),
    queryFn: () => api.getSeats(year, round),
    placeholderData: keepPreviousData,
  });
}

export function useTrends(year?: string, round?: string) {
  return useQuery({
    queryKey: queryKeys.trends(year, round),
    queryFn: () => api.getTrends(year, round),
    placeholderData: keepPreviousData,
  });
}

export function useStudentSearch(q: StudentSearchQuery) {
  return useQuery({
    queryKey: queryKeys.students(q),
    queryFn: () => api.searchStudents(q),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => api.getStudent(id),
    enabled: Boolean(id),
  });
}

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports(),
    queryFn: () => api.getReports(),
  });
}

export function useHod(year?: string) {
  return useQuery({
    queryKey: queryKeys.hod(year),
    queryFn: () => api.getHod(year),
    placeholderData: keepPreviousData,
  });
}

export function useSummary(year?: string) {
  return useQuery({
    queryKey: queryKeys.summary(year),
    queryFn: () => api.getSummary(year),
    placeholderData: keepPreviousData,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, remember }: { email: string; password: string; remember: boolean }) =>
      api.login(email, password, remember),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}