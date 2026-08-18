export type Role = 'AHOD' | 'HOD';

export type Gender = 'Male' | 'Female';

export type Community =
  | 'OC'
  | 'BC'
  | 'BCM'
  | 'MBC'
  | 'SC'
  | 'SCA'
  | 'ST';

export type ApplicationStatus =
  | 'Applied'
  | 'Counselling Registered'
  | 'Verified'
  | 'Allotted'
  | 'Confirmed'
  | 'Joined'
  | 'Not Interested'
  | 'Rejected';

export type AdmissionRound = 'Round 1' | 'Round 2' | 'Round 3' | 'Round 4';

export type Quota = 'Government' | 'Management';

export type SchoolType =
  | 'Government'
  | 'Government Aided'
  | 'Private'
  | 'Matriculation'
  | 'CBSE'
  | 'Kendriya Vidyalaya';

export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  title: string;
  initials: string;
  avatarColor: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface StudentDocument {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadedAt: string;
  status: 'Verified' | 'Pending' | 'Action Required';
}

export interface VerificationEntry {
  id: string;
  action: string;
  actor: string;
  role: Role;
  timestamp: string;
  outcome: 'Approved' | 'Flagged' | 'Comment' | 'Submitted';
  note?: string;
}

export interface Student {
  id: string;
  applicationNo: string;
  registerNo: string;
  name: string;
  gender: Gender;
  community: Community;
  category: string;
  district: string;
  schoolName: string;
  schoolType: SchoolType;
  cutoff: number;
  percentage: number;
  status: ApplicationStatus;
  round: AdmissionRound | null;
  quota: Quota;
  academicYear: string;
  preferredDepartments: string[];
  phone: string;
  email: string;
  address: string;
  appliedAt: string;
  updatedAt: string;
  admittedAt: string | null;
  fatherName: string;
  motherName: string;
  dob: string;
  bloodGroup: string;
}

export interface StudentProfile extends Student {
  documents: StudentDocument[];
  verificationHistory: VerificationEntry[];
  preferences: { rank: number; department: string; code: string }[];
  timeline: {
    label: string;
    date: string;
    status: 'completed' | 'active' | 'pending';
    description: string;
  }[];
  avgCutoff: number;
  rank: number;
  allottedRound: AdmissionRound | null;
  counsellingCode: string;
}

export interface KpiDefinition {
  key: string;
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  format?: 'number' | 'percent' | 'currency';
  hint?: string;
}

export interface TrendPoint {
  date: string;
  label: string;
  applications: number;
  registered: number;
  verified: number;
  allotted: number;
  confirmed: number;
  joined: number;
}

export interface CategoryDatum {
  name: string;
  value: number;
  color: string;
}

export interface DistrictDatum {
  district: string;
  applications: number;
  admitted: number;
}

export interface SchoolTypeDatum {
  name: string;
  applications: number;
  admitted: number;
}

export interface PercentageBucket {
  bucket: string;
  min: number;
  max: number;
  count: number;
}

export interface OverviewPayload {
  kpis: KpiDefinition[];
  applicationTrend: TrendPoint[];
  admissionTrend: TrendPoint[];
  categoryDistribution: CategoryDatum[];
  genderDistribution: CategoryDatum[];
  roundDistribution: CategoryDatum[];
  statusDistribution: CategoryDatum[];
  seatUtilization: {
    intake: number;
    filled: number;
    vacant: number;
    government: number;
    management: number;
  };
  generatedAt: string;
}

export interface ApplicationsQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  round?: string;
  community?: string;
  status?: string;
  district?: string;
  academicYear?: string;
  gender?: string;
}

export interface ApplicationsPayload {
  rows: Student[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pagination?: PaginationResponse;
  facets: {
    communities: string[];
    districts: string[];
    statuses: string[];
    rounds: string[];
    years: string[];
  };
  summary: {
    applied: number;
    confirmed: number;
    joined: number;
    rejected: number;
  };
}

export interface AnalyticsPayload {
  kpis: KpiDefinition[];
  communityDistribution: CategoryDatum[];
  genderDistribution: CategoryDatum[];
  districtWise: DistrictDatum[];
  percentageHistogram: PercentageBucket[];
  schoolTypeDistribution: SchoolTypeDatum[];
  statusBreakdown: CategoryDatum[];
  roundBreakdown: CategoryDatum[];
  filters: {
    years: string[];
    rounds: string[];
    communities: string[];
    genders: string[];
  };
}

export interface SeatRoundFilling {
  round: string;
  allotted: number;
  confirmed: number;
  joined: number;
  vacantAfter: number;
  utilization: number;
}

export interface SeatHistoryPoint {
  year: string;
  intake: number;
  filled: number;
  occupancy: number;
}

export interface SeatAnalysisPayload {
  kpis: KpiDefinition[];
  intake: number;
  governmentQuota: number;
  managementQuota: number;
  filled: number;
  vacant: number;
  occupancy: number;
  quotaDonut: CategoryDatum[];
  roundFilling: SeatRoundFilling[];
  compare: { label: string; available: number; utilized: number }[];
  history: SeatHistoryPoint[];
  yearlyBreakdown: {
    year: string;
    government: number;
    management: number;
    total: number;
    occupied: number;
  }[];
  filters: {
    years: string[];
    rounds: string[];
  };
}

export interface TrendMetrics {
  totalApplications: number;
  confirmedAdmissions: number;
  conversionRate: number;
  peakDay: { date: string; count: number };
  averageDaily: number;
  bestWeek: { label: string; count: number };
}

export interface TrendsPayload {
  metrics: KpiDefinition[];
  series: TrendPoint[];
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
  peaks: { date: string; count: number }[];
  stageFunnel: CategoryDatum[];
  weekdayPattern: { day: string; value: number }[];
  filters: {
    years: string[];
    rounds: string[];
  };
}

export interface StudentSearchQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  district?: string;
  community?: string;
  status?: string;
  gender?: string;
}

export interface StudentSearchPayload {
  rows: Student[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pagination?: PaginationResponse;
  facets: {
    districts: string[];
    communities: string[];
    statuses: string[];
    genders: string[];
  };
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  formats: ('PDF' | 'Excel' | 'CSV')[];
  size: string;
  lastGenerated?: string;
  suggested: boolean;
}

export interface GeneratedReport {
  id: string;
  reportId: string;
  reportName: string;
  format: 'PDF' | 'Excel' | 'CSV';
  generatedBy: string;
  generatedAt: string;
  size: string;
  status: 'Ready' | 'Generating' | 'Failed';
  rows: number;
}

export interface ReportsPayload {
  reports: ReportDefinition[];
  history: GeneratedReport[];
}

export interface HodPayload {
  kpis: KpiDefinition[];
  recentAdmissions: Student[];
  verificationQueue: {
    id: string;
    student: string;
    applicationNo: string;
    category: string;
    cutoff: number;
    submittedAt: string;
    daysPending: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  pendingActions: {
    id: string;
    title: string;
    description: string;
    count: number;
    tone: 'brand' | 'amber' | 'rose' | 'emerald';
  }[];
  roundProgress: {
    round: string;
    target: number;
    achieved: number;
    percentage: number;
  }[];
  statusBreakdown: CategoryDatum[];
  admissionCurve: TrendPoint[];
  filters: {
    years: string[];
    rounds: string[];
  };
}

export interface SummaryPayload {
  generatedAt: string;
  academicYear: string;
  kpis: KpiDefinition[];
  roundComparison: { round: string; applied: number; allotted: number; joined: number }[];
  categoryComparison: CategoryDatum[];
  genderComparison: CategoryDatum[];
  districtTop: { district: string; applications: number; admitted: number; conversion: number }[];
  trendSeries: TrendPoint[];
  statusBreakdown: CategoryDatum[];
  seatMatrix: {
    quota: string;
    intake: number;
    filled: number;
    vacant: number;
    utilization: number;
  }[];
}

export interface ApiErrorPayload {
  message: string;
  code: string;
  status: number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationResponse {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface StandardResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
  pagination?: PaginationResponse;
  timestamp: string;
  request_id: string;
}
