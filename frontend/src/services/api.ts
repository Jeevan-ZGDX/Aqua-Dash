import type {
  AnalyticsPayload,
  ApplicationsPayload,
  ApplicationsQuery,
  CategoryDatum,
  HodPayload,
  KpiDefinition,
  OverviewPayload,
  ReportsPayload,
  SeatAnalysisPayload,
  Student,
  StudentProfile,
  StudentSearchPayload,
  StudentSearchQuery,
  SummaryPayload,
  TrendsPayload,
  User,
} from '@/types';
import {
  ADMISSION_ROUNDS,
  CHART_COLORS,
  COMMUNITIES,
  COMMUNITY_COLORS,
  CURRENT_ACADEMIC_YEAR,
  GENDERS,
  GENDER_COLORS,
  QUOTAS,
  QUOTA_COLORS,
  STATUS_COLORS,
} from '@/constants';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

function getAuthHeaders(): HeadersInit {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
  }
  return {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${API_V1_PREFIX}${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...init?.headers,
  };

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  const body = await res.json().catch(() => null);
  
  if (!res.ok) {
    const message = body?.message || 'Something went wrong';
    const code = body?.code || 'UNKNOWN_ERROR';
    throw new ApiError(message, res.status, code);
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  
  return body as T;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ─── Backend Response Transformations ────────────────────────────────────────

function transformStudent(s: any): Student {
  return {
    id: String(s.id),
    applicationNo: s.application_number || '',
    registerNo: s.register_number || '',
    name: s.name || '',
    gender: (s.gender || 'Male') as any,
    community: (s.community || 'OC') as any,
    category: s.community || '',
    district: s.district || '',
    schoolName: s.school_name || '',
    schoolType: (s.school_type || 'Private') as any,
    cutoff: s.cutoff_score || 0,
    percentage: s.percentage || 0,
    status: (s.admission_status || 'Applied') as any,
    round: s.admission_round?.name || null,
    quota: (s.quota || 'Government') as any,
    academicYear: s.academic_year?.year || CURRENT_ACADEMIC_YEAR,
    preferredDepartments: [],
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    appliedAt: s.created_at || new Date().toISOString(),
    updatedAt: s.updated_at || new Date().toISOString(),
    admittedAt: s.admission_date || null,
    fatherName: s.father_name || '',
    motherName: s.mother_name || '',
    dob: s.date_of_birth || '',
    bloodGroup: s.blood_group || '',
  };
}

function transformStudentProfile(s: any): StudentProfile {
  const student = transformStudent(s);
  return {
    ...student,
    documents: (s.documents || []).map((d: any) => ({
      id: String(d.id),
      name: d.document_type || d.original_filename || 'Document',
      category: d.document_type || 'Document',
      size: d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : '0 KB',
      uploadedAt: d.created_at || new Date().toISOString(),
      status: d.verification_status === 'VERIFIED' ? 'Verified' : d.verification_status === 'REJECTED' ? 'Action Required' : 'Pending',
    })),
    verificationHistory: (s.audit_logs || []).map((a: any) => ({
      id: String(a.id),
      action: a.action || '',
      actor: a.actor_name || 'System',
      role: 'AHOD' as const,
      timestamp: a.created_at || new Date().toISOString(),
      outcome: 'Approved' as const,
      note: a.description || '',
    })),
    preferences: [],
    timeline: [
      { label: 'Applied', date: s.created_at, status: 'completed', description: 'Application submitted' },
      { label: 'Verified', date: s.created_at, status: s.is_verified ? 'completed' : 'pending', description: 'Documents verified' },
      { label: 'Allotted', date: s.admission_date, status: s.admission_status === 'JOINED' ? 'completed' : 'pending', description: 'Seat allotted' },
      { label: 'Joined', date: s.admission_date, status: s.admission_status === 'JOINED' ? 'completed' : 'pending', description: 'Student joined' },
    ],
    avgCutoff: s.cutoff_score || 0,
    rank: s.rank || 0,
    allottedRound: s.admission_round?.name || null,
    counsellingCode: `TNEA-${(s.application_number || '').slice(-6)}`,
  };
}

function transformUser(u: any): User {
  const name = u.name || u.username || 'User';
  const initials = name
    .replace(/^Dr\.\s+/, '')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];
  const colorIndex = (u.id || 0) % palette.length;

  return {
    id: String(u.id),
    name,
    email: u.email || '',
    role: u.role || 'AHOD',
    department: 'Computer Science Engineering',
    title: u.role === 'HOD' ? 'Head of Department' : 'Assistant Head of Department',
    initials,
    avatarColor: palette[colorIndex],
  };
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
  remember: boolean;
}

interface BackendLoginResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export const api = {
  login: async (email: string, password: string, remember: boolean): Promise<LoginResponse> => {
    const response = await request<BackendLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
      credentials: 'include' as RequestCredentials,
    });
    
    return {
      user: transformUser(response.user),
      token: response.access_token,
      expiresAt: new Date(Date.now() + response.expires_in * 1000).toISOString(),
      remember,
    };
  },

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
      credentials: 'include' as RequestCredentials,
    }),

  refreshToken: (refreshToken?: string) =>
    request<{ access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include' as RequestCredentials,
    }),

  verifyToken: () =>
    request('/auth/verify', {
      method: 'POST',
      credentials: 'include' as RequestCredentials,
    }),

  getOverview: async (year?: string, round?: string): Promise<OverviewPayload> => {
    const data = await request<any>(`/dashboard/overview${buildQueryString({ academic_year: year, round })}`);
    return transformOverview(data);
  },

  getApplications: async (q: ApplicationsQuery): Promise<ApplicationsPayload> => {
    const params: Record<string, any> = {
      page: q.page,
      page_size: q.pageSize,
      sort_by: q.sortBy,
      sort_order: q.sortDir,
      q: q.search,
      round: q.round,
      community: q.community,
      status: q.status,
      district: q.district,
      academic_year: q.academicYear,
      gender: q.gender,
    };
    const response = await request<any>(`/students${buildQueryString(params)}`);
    return {
      rows: (response.data || []).map(transformStudent),
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      pageSize: response.pagination?.page_size || 10,
      totalPages: response.pagination?.total_pages || 1,
      facets: { communities: [], districts: [], statuses: [], rounds: [], years: [] },
      summary: { applied: response.pagination?.total || 0, confirmed: 0, joined: 0, rejected: 0 },
    };
  },

  getAnalytics: async (filters: { academicYear?: string; round?: string; community?: string; gender?: string }): Promise<AnalyticsPayload> => {
    const params = buildQueryString({
      academic_year: filters.academicYear,
      round: filters.round,
      community: filters.community,
      gender: filters.gender,
    });
    const data = await request<any>(`/analytics/summary${params}`);
    return transformAnalytics(data);
  },

  getSeats: async (academicYear?: string, round?: string): Promise<SeatAnalysisPayload> => {
    const data = await request<any>(`/analytics/summary${buildQueryString({ academic_year: academicYear, round })}`);
    return transformSeats(data);
  },

  getTrends: async (academicYear?: string, round?: string): Promise<TrendsPayload> => {
    const data = await request<any>(`/analytics/summary${buildQueryString({ academic_year: academicYear, round })}`);
    return transformTrends(data);
  },

  searchStudents: async (q: StudentSearchQuery): Promise<StudentSearchPayload> => {
    const params: Record<string, any> = {
      page: q.page,
      page_size: q.pageSize,
      sort_by: q.sortBy,
      sort_order: q.sortDir,
      q: q.search,
      district: q.district,
      community: q.community,
      admission_status: q.status,
      gender: q.gender,
    };
    const response = await request<any>(`/students${buildQueryString(params)}`);
    return {
      rows: (response.data || []).map(transformStudent),
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      pageSize: response.pagination?.page_size || 10,
      totalPages: response.pagination?.total_pages || 1,
      facets: { districts: [], communities: [], statuses: [], genders: [] },
    };
  },

  getStudent: async (id: string): Promise<StudentProfile> => {
    const data = await request<any>(`/students/${id}`);
    return transformStudentProfile(data);
  },

  getReports: async (): Promise<ReportsPayload> => {
    const data = await request<any>('/reports/types');
    return {
      reports: (data || []).map((r: any) => ({
        id: r.type,
        name: r.label,
        description: `${r.label} report for the department`,
        category: 'Summary',
        icon: 'FileSpreadsheet',
        formats: r.formats || ['PDF', 'Excel', 'CSV'],
        size: '~1.0 MB',
        suggested: true,
      })),
      history: [],
    };
  },

  getHod: async (academicYear?: string): Promise<HodPayload> => {
    const data = await request<any>(`/dashboard/overview${buildQueryString({ academic_year: academicYear })}`);
    return transformHod(data);
  },

  getSummary: async (academicYear?: string): Promise<SummaryPayload> => {
    const data = await request<any>(`/dashboard/overview${buildQueryString({ academic_year: academicYear })}`);
    return transformSummary(data);
  },

  createStudent: (data: unknown) =>
    request('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, data: unknown) =>
    request(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    request(`/students/${id}`, {
      method: 'DELETE',
    }),

  verifyStudent: (id: string, data: unknown) =>
    request(`/students/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDocuments: (studentId: string) =>
    request(`/students/${studentId}/documents`),

  uploadDocument: (studentId: string, file: File, documentType: string, remarks?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (remarks) formData.append('remarks', remarks);
    
    return request(`/students/${studentId}/documents`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  verifyDocument: (documentId: string, data: unknown) =>
    request(`/documents/${documentId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAuditHistory: (studentId: string) =>
    request(`/students/${studentId}/audit`),

  generateReport: (data: unknown) =>
    request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  downloadReport: (filename: string) =>
    fetch(`${API_BASE_URL}${API_V1_PREFIX}/reports/download/${filename}`, {
      credentials: 'include',
    }).then(res => res.blob()),

  previewImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/imports/preview', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  uploadImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/imports/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  getImportBatch: (batchId: number) =>
    request(`/imports/batches/${batchId}`),

  getConfig: () => request('/settings/config'),

  getSettings: () => request('/settings'),

  updateSetting: (key: string, value: unknown) =>
    request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  getUsers: (params: { page?: number; pageSize?: number; role?: string; search?: string }) =>
    request('/settings/users'),

  createUser: (data: unknown) =>
    request('/settings/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (userId: number, data: unknown) =>
    request(`/settings/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: number) =>
    request(`/settings/users/${userId}`, {
      method: 'DELETE',
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/settings/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  getRoles: () => request('/settings/roles'),
};

// ─── Transform Functions ──────────────────────────────────────────────────────

function transformOverview(data: any): OverviewPayload {
  const kpis: KpiDefinition[] = [
    { key: 'total', label: 'Total Applications', value: data.total_applications || 0, format: 'number' },
    { key: 'intake', label: 'Seat Intake', value: data.total_seats || 240, format: 'number' },
    { key: 'filled', label: 'Seats Filled', value: data.seats_filled || 0 },
    { key: 'vacant', label: 'Vacant Seats', value: data.vacant_seats || 0 },
    { key: 'admission', label: 'Admission Percentage', value: data.admission_percentage || 0, format: 'percent' },
    { key: 'confirmation', label: 'Confirmation Rate', value: data.confirmation_rate || 0, format: 'percent' },
    { key: 'male', label: 'Male Students', value: data.male_students || 0 },
    { key: 'female', label: 'Female Students', value: data.female_students || 0 },
  ];

  return {
    kpis,
    applicationTrend: [],
    admissionTrend: [],
    categoryDistribution: Object.entries(data.community_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: COMMUNITY_COLORS[name as keyof typeof COMMUNITY_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    genderDistribution: [
      { name: 'Male', value: data.male_students || 0, color: GENDER_COLORS.Male },
      { name: 'Female', value: data.female_students || 0, color: GENDER_COLORS.Female },
    ],
    roundDistribution: ADMISSION_ROUNDS.map((r, i) => ({ name: r, value: 0, color: CHART_COLORS[i % CHART_COLORS.length] })),
    statusDistribution: Object.entries(data.status_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    seatUtilization: {
      intake: data.total_seats || 240,
      filled: data.seats_filled || 0,
      vacant: data.vacant_seats || 0,
      government: data.government_seats_filled || 0,
      management: data.management_seats_filled || 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

function transformAnalytics(data: any): AnalyticsPayload {
  return {
    kpis: [
      { key: 'applications', label: 'Total Applicants', value: data.total_applications || 0 },
      { key: 'admitted', label: 'Admitted', value: data.seats_filled || 0 },
      { key: 'avg', label: 'Average Cutoff', value: data.average_cutoff || 0, format: 'percent' },
      { key: 'highest', label: 'Highest Cutoff', value: data.highest_cutoff || 0, format: 'percent' },
      { key: 'lowest', label: 'Lowest Cutoff', value: data.lowest_cutoff || 0, format: 'percent' },
    ],
    communityDistribution: Object.entries(data.community_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: COMMUNITY_COLORS[name as keyof typeof COMMUNITY_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    genderDistribution: [
      { name: 'Male', value: data.male_students || 0, color: GENDER_COLORS.Male },
      { name: 'Female', value: data.female_students || 0, color: GENDER_COLORS.Female },
    ],
    districtWise: Object.entries(data.district_distribution || {}).map(([district, count]) => ({
      district,
      applications: count as number,
      admitted: 0,
    })).sort((a, b) => b.applications - a.applications).slice(0, 14),
    percentageHistogram: data.cutoff_analysis?.buckets || [],
    schoolTypeDistribution: Object.entries(data.school_type_distribution || {}).map(([name, count]) => ({
      name,
      applications: count as number,
      admitted: 0,
    })),
    statusBreakdown: Object.entries(data.status_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    roundBreakdown: ADMISSION_ROUNDS.map((r, i) => ({ name: r, value: 0, color: CHART_COLORS[i % CHART_COLORS.length] })),
    filters: {
      years: [CURRENT_ACADEMIC_YEAR],
      rounds: ADMISSION_ROUNDS,
      communities: COMMUNITIES,
      genders: GENDERS,
    },
  };
}

function transformSeats(data: any): SeatAnalysisPayload {
  const intake = data.total_seats || 240;
  const filled = data.seats_filled || 0;
  const vacant = data.vacant_seats || 0;
  const occupancy = intake ? (filled / intake) * 100 : 0;

  return {
    kpis: [
      { key: 'intake', label: 'Sanctioned Intake', value: intake },
      { key: 'govt', label: 'Government Quota', value: Math.round(intake * 0.7) },
      { key: 'mgmt', label: 'Management Quota', value: Math.round(intake * 0.3) },
      { key: 'filled', label: 'Seats Filled', value: filled },
      { key: 'vacant', label: 'Vacant Seats', value: vacant },
      { key: 'occupancy', label: 'Occupancy', value: occupancy, format: 'percent' },
    ],
    intake,
    governmentQuota: Math.round(intake * 0.7),
    managementQuota: Math.round(intake * 0.3),
    filled,
    vacant,
    occupancy,
    quotaDonut: [
      { name: 'Government Filled', value: Math.round(filled * 0.7), color: QUOTA_COLORS.Government },
      { name: 'Management Filled', value: Math.round(filled * 0.3), color: QUOTA_COLORS.Management },
      { name: 'Vacant', value: vacant, color: '#cbd5e1' },
    ],
    roundFilling: ADMISSION_ROUNDS.map((r) => ({ round: r, allotted: 0, confirmed: 0, joined: 0, vacantAfter: vacant, utilization: occupancy })),
    compare: [
      { label: 'Government', available: Math.round(intake * 0.7), utilized: Math.round(filled * 0.7) },
      { label: 'Management', available: Math.round(intake * 0.3), utilized: Math.round(filled * 0.3) },
    ],
    history: [{ year: CURRENT_ACADEMIC_YEAR, intake, filled, occupancy }],
    yearlyBreakdown: [{ year: CURRENT_ACADEMIC_YEAR, government: Math.round(filled * 0.7), management: Math.round(filled * 0.3), total: filled, occupied: filled }],
    filters: { years: [CURRENT_ACADEMIC_YEAR], rounds: ADMISSION_ROUNDS },
  };
}

function transformTrends(data: any): TrendsPayload {
  const totalApplications = data.total_applications || 0;
  const joined = data.seats_filled || 0;
  const conversion = totalApplications ? (joined / totalApplications) * 100 : 0;

  return {
    metrics: [
      { key: 'total', label: 'Total Applications', value: totalApplications },
      { key: 'confirmed', label: 'Confirmed Admissions', value: joined },
      { key: 'conversion', label: 'Conversion Rate', value: conversion, format: 'percent' },
      { key: 'peak', label: 'Peak Day', value: 0 },
      { key: 'avgDaily', label: 'Average Daily', value: 0 },
      { key: 'bestWeek', label: 'Best Week', value: 0 },
    ],
    series: [],
    daily: [],
    weekly: [],
    monthly: [],
    peaks: [],
    stageFunnel: [
      { name: 'Applied', value: totalApplications, color: STATUS_COLORS.Applied },
      { name: 'Registered', value: 0, color: STATUS_COLORS['Counselling Registered'] },
      { name: 'Allotted', value: 0, color: STATUS_COLORS.Allotted },
      { name: 'Confirmed', value: joined, color: STATUS_COLORS.Confirmed },
      { name: 'Joined', value: joined, color: STATUS_COLORS.Joined },
    ],
    weekdayPattern: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => ({ day, value: 0 })),
    filters: { years: [CURRENT_ACADEMIC_YEAR], rounds: ADMISSION_ROUNDS },
  };
}

function transformHod(data: any): HodPayload {
  const totalApplications = data.total_applications || 0;
  const filled = data.seats_filled || 0;
  const vacant = data.vacant_seats || 0;
  const intake = data.total_seats || 240;
  const utilization = intake ? (filled / intake) * 100 : 0;

  return {
    kpis: [
      { key: 'allotted', label: 'Students Allotted', value: 0 },
      { key: 'pending', label: 'Pending Verification', value: 0 },
      { key: 'verified', label: 'Verified Students', value: 0 },
      { key: 'vacant', label: 'Vacant Seats', value: vacant },
      { key: 'utilization', label: 'Seat Utilization', value: utilization, format: 'percent' },
    ],
    recentAdmissions: [],
    verificationQueue: [],
    pendingActions: [
      { id: 'verify', title: 'Verify Pending Applications', description: '0 applications awaiting document verification', count: 0, tone: 'brand' },
      { id: 'confirm', title: 'Confirm Allotted Seats', description: 'Follow up on candidates allotted in recent rounds', count: 0, tone: 'amber' },
      { id: 'review', title: 'Review Rejected Applications', description: 'Applications flagged or rejected require review', count: 0, tone: 'rose' },
      { id: 'export', title: 'Department Report Export', description: 'Generate the monthly departmental progress report', count: 1, tone: 'emerald' },
    ],
    roundProgress: ADMISSION_ROUNDS.map((r) => ({ round: r, target: 50, achieved: 0, percentage: 0 })),
    statusBreakdown: Object.entries(data.status_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    admissionCurve: [],
    filters: { years: [CURRENT_ACADEMIC_YEAR], rounds: ADMISSION_ROUNDS },
  };
}

function transformSummary(data: any): SummaryPayload {
  const intake = data.total_seats || 240;
  const filled = data.seats_filled || 0;
  const vacant = data.vacant_seats || 0;
  const totalApplications = data.total_applications || 0;
  const male = data.male_students || 0;
  const female = data.female_students || 0;

  return {
    generatedAt: new Date().toISOString(),
    academicYear: CURRENT_ACADEMIC_YEAR,
    kpis: [
      { key: 'applications', label: 'Total Applications', value: totalApplications },
      { key: 'intake', label: 'Seat Intake', value: intake },
      { key: 'filled', label: 'Seats Filled', value: filled },
      { key: 'vacant', label: 'Vacant Seats', value: vacant },
      { key: 'admission', label: 'Admission Percentage', value: intake ? (filled / intake) * 100 : 0, format: 'percent' },
      { key: 'confirmation', label: 'Confirmation Rate', value: 0, format: 'percent' },
      { key: 'male', label: 'Male Students', value: male },
      { key: 'female', label: 'Female Students', value: female },
    ],
    roundComparison: ADMISSION_ROUNDS.map((r) => ({ round: r, applied: 0, allotted: 0, joined: 0 })),
    categoryComparison: Object.entries(data.community_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: COMMUNITY_COLORS[name as keyof typeof COMMUNITY_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    genderComparison: [
      { name: 'Male', value: male, color: GENDER_COLORS.Male },
      { name: 'Female', value: female, color: GENDER_COLORS.Female },
    ],
    districtTop: Object.entries(data.district_distribution || {}).map(([district, count]) => ({
      district,
      applications: count as number,
      admitted: 0,
      conversion: 0,
    })).slice(0, 10),
    trendSeries: [],
    statusBreakdown: Object.entries(data.status_distribution || {}).map(([name, value], i) => ({
      name,
      value: value as number,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || CHART_COLORS[i % CHART_COLORS.length],
    })),
    seatMatrix: QUOTAS.map((q) => ({
      quota: q,
      intake: q === 'Government' ? Math.round(intake * 0.7) : Math.round(intake * 0.3),
      filled: q === 'Government' ? Math.round(filled * 0.7) : Math.round(filled * 0.3),
      vacant: q === 'Government' ? Math.round(vacant * 0.7) : Math.round(vacant * 0.3),
      utilization: 0,
    })),
  };
}

export { buildQueryString as getQueryString };