import type {
  AdmissionRound,
  ApplicationStatus,
  Community,
  Gender,
  Quota,
  Role,
} from '@/types';

export const APP_NAME = 'CSE Admissions Analytics';
export const APP_SHORT_NAME = 'AIDDS';
export const DEPARTMENT = 'Computer Science Engineering';
export const COLLEGE_NAME = 'Chennai Institute of Technology';
export const ACADEMIC_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];
export const CURRENT_ACADEMIC_YEAR = '2026-27';

export const ADMISSION_ROUNDS: AdmissionRound[] = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
];

export const ROUND_ORDER: Record<string, number> = {
  'Round 1': 1,
  'Round 2': 2,
  'Round 3': 3,
  'Round 4': 4,
};

export const ROUND_VALUES = ['Round 1', 'Round 2', 'Round 3', 'Round 4'];

export const STATUS_ORDER: Record<string, number> = {
  Applied: 0,
  'Counselling Registered': 1,
  Verified: 2,
  Allotted: 3,
  Confirmed: 4,
  Joined: 5,
  'Not Interested': 6,
  Rejected: 7,
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Counselling Registered',
  'Verified',
  'Allotted',
  'Confirmed',
  'Joined',
  'Not Interested',
  'Rejected',
];

export const COMMUNITIES: Community[] = ['OC', 'BC', 'BCM', 'MBC', 'SC', 'SCA', 'ST'];

export const COMMUNITY_LABELS: Record<string, string> = {
  OC: 'Open Competition',
  BC: 'Backward Class',
  BCM: 'Backward Class (M)',
  MBC: 'Most Backward Class',
  SC: 'Scheduled Caste',
  SCA: 'Scheduled Caste (A)',
  ST: 'Scheduled Tribe',
};

export const GENDERS: Gender[] = ['Male', 'Female'];

export const QUOTAS: Quota[] = ['Government', 'Management'];

export const DISTRICTS = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Vellore',
  'Thoothukudi',
  'Thanjavur',
  'Kanyakumari',
  'Virudhunagar',
  'Dindigul',
  'Erode',
  'Karur',
  'Namakkal',
  'Cuddalore',
  'Villupuram',
  'Tiruvallur',
  'Kancheepuram',
  'Thiruvannamalai',
  'Nagapattinam',
  'Ramanathapuram',
  'Sivaganga',
  'Pudukkottai',
  'Theni',
  'Krishnagiri',
  'Dharmapuri',
  'Nilgiris',
  'Ariyalur',
  'Perambalur',
  'Tirupathur',
  'Tenkasi',
  'Chengalpattu',
  'Ranipet',
  'Mayiladuthurai',
];

export const SCHOOL_TYPES = [
  'Government',
  'Government Aided',
  'Private',
  'Matriculation',
  'CBSE',
  'Kendriya Vidyalaya',
];

export const STATUS_BADGE_TONES: Record<
  ApplicationStatus,
  { tone: string; dot: string }
> = {
  Applied: { tone: 'neutral', dot: 'bg-slate-400' },
  'Counselling Registered': { tone: 'blue', dot: 'bg-sky-500' },
  Verified: { tone: 'violet', dot: 'bg-violet-500' },
  Allotted: { tone: 'indigo', dot: 'bg-indigo-500' },
  Confirmed: { tone: 'emerald', dot: 'bg-emerald-500' },
  Joined: { tone: 'green', dot: 'bg-green-500' },
  'Not Interested': { tone: 'amber', dot: 'bg-amber-500' },
  Rejected: { tone: 'rose', dot: 'bg-rose-500' },
};

export const ROLE_LABELS: Record<Role, string> = {
  AHOD: 'Assistant Head of Department',
  HOD: 'Head of Department',
};

export const NAV_ITEMS: {
  label: string;
  href: string;
  icon: string;
  roles?: Role[];
  section: 'overview' | 'manage' | 'analytics' | 'system';
}[] = [
  { label: 'Overview', href: '/overview', icon: 'LayoutDashboard', section: 'overview' },
  {
    label: 'Applications',
    href: '/applications',
    icon: 'FileText',
    section: 'manage',
  },
  {
    label: 'Student Analytics',
    href: '/analytics',
    icon: 'PieChart',
    section: 'analytics',
  },
  {
    label: 'Seat Analysis',
    href: '/seat-analysis',
    icon: 'Armchair',
    section: 'analytics',
  },
  {
    label: 'Admission Trends',
    href: '/admission-trends',
    icon: 'TrendingUp',
    section: 'analytics',
  },
  {
    label: 'Student Search',
    href: '/students',
    icon: 'Search',
    section: 'manage',
  },
  { label: 'Reports', href: '/reports', icon: 'FileBarChart', section: 'system' },
  { label: 'HOD Dashboard', href: '/hod', icon: 'ShieldCheck', roles: ['HOD'], section: 'system' },
  { label: 'Summary & Export', href: '/summary', icon: 'FileSpreadsheet', section: 'system' },
];

export const CHART_COLORS = [
  '#6366f1',
  '#22d3ee',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#8b5cf6',
  '#84cc16',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
];

export const COMMUNITY_COLORS: Record<Community, string> = {
  OC: '#6366f1',
  BC: '#22d3ee',
  BCM: '#f59e0b',
  MBC: '#10b981',
  SC: '#8b5cf6',
  SCA: '#f43f5e',
  ST: '#06b6d4',
};

export const GENDER_COLORS: Record<Gender, string> = {
  Male: '#6366f1',
  Female: '#ec4899',
};

export const QUOTA_COLORS: Record<Quota, string> = {
  Government: '#6366f1',
  Management: '#f59e0b',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: '#94a3b8',
  'Counselling Registered': '#0ea5e9',
  Verified: '#8b5cf6',
  Allotted: '#6366f1',
  Confirmed: '#10b981',
  Joined: '#22c55e',
  'Not Interested': '#f59e0b',
  Rejected: '#f43f5e',
};

export const SIDE_BAR_SECTIONS: { label: string; key: string }[] = [
  { label: 'Overview', key: 'overview' },
  { label: 'Management', key: 'manage' },
  { label: 'Analytics', key: 'analytics' },
  { label: 'System', key: 'system' },
];

export const TOAST_LIMIT = 4;

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZES = [10, 25, 50, 100];

export const CUTOFF_MAX = 200;

export const SEAT_INTAKE = 240;

export const QUOTA_SPLIT: Record<Quota, number> = {
  Government: 168,
  Management: 72,
};
