import {
  ACADEMIC_YEARS,
  COMMUNITIES,
  DISTRICTS,
  GENDERS,
  SCHOOL_TYPES,
} from '@/constants';
import type {
  AdmissionRound,
  ApplicationStatus,
  Community,
  Gender,
  SchoolType,
  Student,
  StudentProfile,
  VerificationEntry,
} from '@/types';
import { hashSeed, mulberry32, pickRandom, shuffle, normal } from '@/utils/random';

export const COUNSELLING_WINDOWS: Record<string, { start: string; end: string }> = {
  '2023-24': { start: '2023-05-25', end: '2023-08-10' },
  '2024-25': { start: '2024-05-24', end: '2024-08-09' },
  '2025-26': { start: '2025-05-23', end: '2025-08-09' },
  '2026-27': { start: '2026-05-22', end: '2026-08-08' },
};

export const YEAR_APPLICATIONS: Record<string, number> = {
  '2023-24': 982,
  '2024-25': 1156,
  '2025-26': 1297,
  '2026-27': 1453,
};

const FIRST_NAMES_M = [
  'Arun', 'Bala', 'Charan', 'Dinesh', 'Ezhil', 'Gokul', 'Harish', 'Ishaan', 'Jagan',
  'Karthik', 'Lokesh', 'Manoj', 'Naveen', 'Praveen', 'Rahul', 'Santhosh', 'Tharun',
  'Vignesh', 'Yuvaraj', 'Ajith', 'Bharath', 'Deepak', 'Faisal', 'Ganesh', 'Hemanth',
  'Imran', 'Kavin', 'Logesh', 'Mithun', 'Nikhil', 'Pradeep', 'Ramesh', 'Suresh',
  'Vijay', 'Yogesh', 'Aravind', 'Balaji', 'Dhanush', 'Elavarasan', 'Gowtham',
  'Hariharan', 'Jeevan', 'Kishore', 'Mohan', 'Naresh', 'Prakash', 'Ravi', 'Selvam',
];

const FIRST_NAMES_F = [
  'Ananya', 'Bhavya', 'Charulatha', 'Divya', 'Eswari', 'Gayathri', 'Harini', 'Indhuja',
  'Janani', 'Kavya', 'Lakshmi', 'Mahalakshmi', 'Nandhini', 'Priyadharshini', 'Ramya',
  'Sowmiya', 'Thamizhselvi', 'Vidhya', 'Yazhini', 'Abinaya', 'Bhuvaneshwari', 'Deepika',
  'Farhana', 'Gomathi', 'Hema', 'Iswarya', 'Jothika', 'Keerthana', 'Logapriya', 'Madhumitha',
  'Nivetha', 'Pavithra', 'Ranjani', 'Sharmila', 'Tharani', 'Uma', 'Varshini', 'Yamuna',
];

const LAST_NAMES = [
  'Rajan', 'Muthu', 'Kumar', 'Sundar', 'Venkatesh', 'Suresh', 'Pandian', 'Ilango',
  'Krishnan', 'Ramasamy', 'Selvaraj', 'Murugan', 'Palani', 'Sivakumar', 'Ganesan',
  'Subramanian', 'Natarajan', 'Balasubramanian', 'Kandasamy', 'Arumugam', 'Ravichandran',
  'Durairaj', 'Mahendran', 'Sathish', 'Baskaran', 'Karthikeyan', 'Chandrasekar',
];

const SCHOOL_NAMES = [
  'Govt Higher Secondary School',
  'St. Josephs Hr Sec School',
  'GHSS Anna Nagar',
  'SBOA Matriculation School',
  'Kendriya Vidyalaya',
  'DAV Public School',
  'Srinivasa Hr Sec School',
  'GHSS Chromepet',
  'Vivekananda Matric School',
  'Mount Carmel Matric School',
  'GHSS Gandhipuram',
  'Bharathi Vidyalaya',
  'Velammal Matric School',
  'Zion Matric Hr Sec School',
  'GHSS Tirunelveli',
  'Sri Chaitanya School',
  'National Higher Secondary School',
  'GHSS Madurai',
];

const PREFERRED_DEPARTMENTS = [
  'CSE', 'IT', 'AIDS', 'AIML', 'CSBS', 'ECE', 'Mech', 'Civil', 'EEE',
];

const STREETS = [
  'Anna Nagar', 'Gandhi Street', 'Nehru Street', 'Ram Nagar', 'Kamarajar Salai',
  'Gandhipuram', 'Cross Cut Road', 'Bazaar Street', 'Church Street', 'Marina Road',
  'Sathy Road', 'Avinashi Road', 'Raja Street', 'Market Road', 'Colony Road',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const YEAR_STATUS_TARGETS: Record<
  string,
  { joined: number; confirmed: number; allotted: number; verified: number; registered: number; notInterested: number; rejected: number }
> = {
  '2023-24': { joined: 214, confirmed: 18, allotted: 40, verified: 80, registered: 200, notInterested: 22, rejected: 18 },
  '2024-25': { joined: 212, confirmed: 20, allotted: 46, verified: 92, registered: 220, notInterested: 24, rejected: 20 },
  '2025-26': { joined: 196, confirmed: 26, allotted: 55, verified: 110, registered: 240, notInterested: 26, rejected: 24 },
  '2026-27': { joined: 162, confirmed: 34, allotted: 60, verified: 130, registered: 260, notInterested: 30, rejected: 28 },
};

function roundForCutoff(cutoff: number): AdmissionRound {
  if (cutoff >= 185) return 'Round 1';
  if (cutoff >= 175) return 'Round 2';
  if (cutoff >= 162) return 'Round 3';
  return 'Round 4';
}

function dateBetween(startIso: string, endIso: string, progress: number): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const t = start + (end - start) * progress;
  return new Date(t).toISOString();
}

function schoolTypeFor(rand: () => number): { type: SchoolType; name: string } {
  const type = pickRandom(rand, SCHOOL_TYPES) as SchoolType;
  const base = pickRandom(rand, SCHOOL_NAMES);
  const name =
    type === 'CBSE'
      ? pickRandom(rand, ['DAV Public School', 'Sri Chaitanya School', 'SBOA CBSE School'])
      : type === 'Kendriya Vidyalaya'
        ? 'Kendriya Vidyalaya'
        : type === 'Matriculation'
          ? pickRandom(rand, SCHOOL_NAMES.filter((s) => s.includes('Matric')))
          : type === 'Private'
            ? pickRandom(rand, SCHOOL_NAMES.filter((s) => !s.includes('GHSS') && !s.includes('Govt')))
            : base;
  return { type, name };
}

function buildStudent(year: string, index: number, status: ApplicationStatus, round: AdmissionRound | null): Student {
  const rand = mulberry32(hashSeed('student', year, index));
  const rng = () => rand();

  const gender = pickRandom(rng, GENDERS) as Gender;
  const namePool = gender === 'Male' ? FIRST_NAMES_M : FIRST_NAMES_F;
  const firstName = pickRandom(rng, namePool);
  const lastName = pickRandom(rng, LAST_NAMES);
  const name = `${firstName} ${lastName}`;

  const community = pickRandom(rng, COMMUNITIES) as Community;
  const district = pickRandom(rng, DISTRICTS);
  const quota = rng() < 0.72 ? 'Government' : 'Management';

  const yearNum = year.slice(0, 4);
  const applicationNo = `TNEA${yearNum}-${String(100000 + index).padStart(6, '0')}`;
  const registerNo = `${yearNum}${String(40000 + index * 7).padStart(5, '0')}`;

  const cutoffBase = normal(rng, 168, 16);
  const cutoff = Math.max(118, Math.min(199.5, cutoffBase));

  const { type: schoolType, name: schoolName } = schoolTypeFor(rng);

  const window = COUNSELLING_WINDOWS[year];
  const windowDays = (new Date(window.end).getTime() - new Date(window.start).getTime()) / 86400000;
  const peak = 0.45 + rng() * 0.4;
  const dayOffset = (peak * windowDays * (0.25 + rng() * 0.5) + rng() * windowDays * 0.15);
  const appliedProgress = Math.min(1, dayOffset / windowDays);
  const appliedAt = dateBetween(window.start, window.end, appliedProgress);

  const applied = new Date(appliedAt);
  const updated = new Date(applied.getTime() + rng() * 12 * 86400000);

  const percentage = Math.max(72, Math.min(99.6, 88 + (cutoff - 150) * 0.32 + rng() * 4));

  return {
    id: `stu-${year}-${index}`,
    applicationNo,
    registerNo,
    name,
    gender,
    community,
    category: community,
    district,
    schoolName,
    schoolType,
    cutoff: Math.round(cutoff * 100) / 100,
    percentage: Math.round(percentage * 10) / 10,
    status,
    round,
    quota,
    academicYear: year,
    preferredDepartments: shuffle(rng, PREFERRED_DEPARTMENTS).slice(0, 3),
    phone: `+91 ${Math.floor(9000000000 + rng() * 999999999)}`,
    email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}@student.cit.edu`,
    address: `${Math.floor(1 + rng() * 120)}, ${pickRandom(rng, STREETS)}, ${district}`,
    appliedAt: applied.toISOString(),
    updatedAt: updated.toISOString(),
    admittedAt: null,
    fatherName: `Mr. ${lastName} ${pickRandom(rng, ['Rajan', 'Kumar', 'Sundar', 'Venkatesh'])}`,
    motherName: `Mrs. ${pickRandom(rng, ['Lakshmi', 'Meena', 'Kavitha', 'Rani', 'Uma'])}`,
    dob: new Date(2007 - Math.floor(rng() * 3), Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)).toISOString().slice(0, 10),
    bloodGroup: pickRandom(rng, BLOOD_GROUPS),
  };
}

let database: Student[] | null = null;

export function getAllStudents(): Student[] {
  if (!database) {
    const list: Student[] = [];
    for (const year of ACADEMIC_YEARS) {
      const count = YEAR_APPLICATIONS[year];
      const cohort: Student[] = [];
      for (let i = 0; i < count; i++) {
        cohort.push(buildStudent(year, i, 'Applied', null));
      }

      const ranked = cohort.slice().sort((a, b) => b.cutoff - a.cutoff);
      const targets = YEAR_STATUS_TARGETS[year];
      const window = COUNSELLING_WINDOWS[year];
      let cursor = 0;

      const take = (n: number, status: ApplicationStatus): void => {
        const slice = ranked.slice(cursor, cursor + n);
        cursor += n;
        slice.forEach((s, i) => {
          s.status = status;
          s.round = roundForCutoff(s.cutoff);
          if (status === 'Joined' || status === 'Confirmed') {
            const progress = Math.min(1, 0.45 + (i / (n || 1)) * 0.5);
            s.admittedAt = dateBetween(window.start, window.end, progress);
          }
        });
      };

      take(targets.joined, 'Joined');
      take(targets.confirmed, 'Confirmed');
      take(targets.allotted, 'Allotted');
      take(targets.verified, 'Verified');
      take(targets.registered, 'Counselling Registered');
      take(targets.notInterested, 'Not Interested');
      take(targets.rejected, 'Rejected');

      list.push(...cohort);
    }
    database = list;
  }
  return database;
}

export function getStudentById(id: string): Student | undefined {
  return getAllStudents().find((s) => s.id === id);
}

export function getStudentByApplicationNo(applicationNo: string): Student | undefined {
  return getAllStudents().find((s) => s.applicationNo === applicationNo);
}

const DOC_TYPES = [
  '12th Mark Statement',
  '10th Mark Statement',
  'Transfer Certificate',
  'Community Certificate',
  'Aadhaar Card',
  'Passport Photo',
  'Income Certificate',
  'Provisional Certificate',
];

export function buildStudentProfile(student: Student): StudentProfile {
  const rand = mulberry32(hashSeed('profile', student.id));
  const rng = () => rand();

  const preferences = student.preferredDepartments.map((dep, i) => ({
    rank: i + 1,
    department: dep,
    code: `${dep}-${student.academicYear.slice(2)}`,
  }));

  const applied = new Date(student.appliedAt);
  const stageOrder: ApplicationStatus[] = [
    'Applied',
    'Counselling Registered',
    'Verified',
    'Allotted',
    'Confirmed',
    'Joined',
  ];
  const currentIndex = stageOrder.indexOf(student.status);

  const timeline = stageOrder
    .filter((s, i) => (currentIndex >= 0 ? i <= currentIndex : i < 2))
    .map((stage, i) => {
      const date = new Date(applied.getTime() + i * 9 * 86400000);
      return {
        label: stage,
        date: date.toISOString(),
        status: (i < currentIndex
          ? 'completed'
          : i === currentIndex
            ? 'active'
            : 'pending') as 'completed' | 'active' | 'pending',
        description:
          stage === 'Applied'
            ? 'Application submitted through TNEA counselling portal'
            : stage === 'Counselling Registered'
              ? 'Candidate registered for counselling'
              : stage === 'Verified'
                ? 'Documents verified by verification cell'
                : stage === 'Allotted'
                  ? `Allotted in ${student.round ?? 'counselling'}`
                  : stage === 'Confirmed'
                    ? 'Candidate confirmed the allotted seat'
                    : 'Candidate joined the department',
      };
    });

  const documents = shuffle(rng, DOC_TYPES)
    .slice(0, 5)
    .map((name, i) => {
      const roll = rng();
      const status =
        i === 0
          ? 'Verified'
          : roll < 0.62
            ? 'Verified'
            : roll < 0.9
              ? 'Pending'
              : 'Action Required';
      return {
        id: `doc-${student.id}-${i}`,
        name,
        category: name.includes('Certificate') ? 'Certificate' : 'Document',
        size: `${(120 + rng() * 700).toFixed(0)} KB`,
        uploadedAt: new Date(applied.getTime() + i * 2 * 86400000).toISOString(),
        status: status as 'Verified' | 'Pending' | 'Action Required',
      };
    });

  const verificationHistory: VerificationEntry[] = [
    {
      id: `vh-${student.id}-0`,
      action: 'Application submitted',
      actor: student.name,
      role: 'AHOD' as const,
      timestamp: student.appliedAt,
      outcome: 'Submitted' as const,
      note: 'Application recorded in the counselling portal.',
    },
    {
      id: `vh-${student.id}-1`,
      action: 'Documents uploaded',
      actor: student.name,
      role: 'AHOD' as const,
      timestamp: new Date(applied.getTime() + 3 * 86400000).toISOString(),
      outcome: 'Submitted' as const,
      note: `${documents.length} supporting documents attached.`,
    },
  ];

  if (currentIndex >= 2) {
    verificationHistory.push({
      id: `vh-${student.id}-2`,
      action: 'Verification completed',
      actor: 'R. Kavitha',
      role: 'AHOD' as const,
      timestamp: new Date(applied.getTime() + 6 * 86400000).toISOString(),
      outcome: 'Approved' as const,
      note: 'Community and academic certificates verified against originals.',
    });
  }
  if (currentIndex >= 3 && student.round) {
    verificationHistory.push({
      id: `vh-${student.id}-3`,
      action: `Seat allotted in ${student.round}`,
      actor: 'TNEA Cell',
      role: 'HOD' as const,
      timestamp: new Date(applied.getTime() + 10 * 86400000).toISOString(),
      outcome: 'Approved' as const,
      note: `Allotted under ${student.quota} quota, cutoff ${student.cutoff.toFixed(2)}.`,
    });
  }

  const allottedRound = student.status === 'Joined' || student.status === 'Confirmed' || student.status === 'Allotted'
    ? student.round
    : null;

  return {
    ...student,
    documents,
    verificationHistory,
    preferences,
    timeline,
    avgCutoff: Math.round(student.cutoff * 100) / 100,
    rank: Math.floor(Math.random() * 900 + 40),
    allottedRound,
    counsellingCode: `TNEA-${student.applicationNo.slice(-6)}`,
  };
}

export function distinct<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function sortStudents(rows: Student[], sortBy: string, sortDir: 'asc' | 'desc'): Student[] {
  const dir = sortDir === 'asc' ? 1 : -1;
  const key = sortBy as keyof Student;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
  });
}

export function getQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}
