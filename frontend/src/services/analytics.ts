import {
  ADMISSION_ROUNDS,
  CHART_COLORS,
  COMMUNITIES,
  COMMUNITY_COLORS,
  CURRENT_ACADEMIC_YEAR,
  DISTRICTS,
  GENDERS,
  GENDER_COLORS,
  QUOTAS,
  QUOTA_COLORS,
  STATUS_COLORS,
} from '@/constants';
import type {
  AnalyticsPayload,
  ApplicationsPayload,
  ApplicationStatus,
  CategoryDatum,
  HodPayload,
  KpiDefinition,
  OverviewPayload,
  ReportsPayload,
  SeatAnalysisPayload,
  Student,
  StudentSearchPayload,
  SummaryPayload,
  TrendPoint,
  TrendsPayload,
} from '@/types';
import {
  COUNSELLING_WINDOWS,
  YEAR_APPLICATIONS,
  distinct,
  getAllStudents,
  getStudentById,
  buildStudentProfile,
  sortStudents,
} from './mock-data';

const JOINED: ApplicationStatus[] = ['Confirmed', 'Joined'];
const ALLOTTED: ApplicationStatus[] = ['Allotted', 'Confirmed', 'Joined'];
const REGISTERED: ApplicationStatus[] = [
  'Counselling Registered',
  'Verified',
  'Allotted',
  'Confirmed',
  'Joined',
];

function roundBuckets(rows: Student[]): TrendPoint[] {
  const points: TrendPoint[] = [];
  const byDay = new Map<string, Student[]>();
  for (const row of rows) {
    const day = row.appliedAt.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }
  const days = Array.from(byDay.keys()).sort();
  for (const day of days) {
    const list = byDay.get(day) ?? [];
    const p = (statuses: ApplicationStatus[]) => list.filter((s) => statuses.includes(s.status)).length;
    points.push({
      date: day,
      label: day,
      applications: list.length,
      registered: p(REGISTERED),
      verified: p(['Verified', 'Allotted', 'Confirmed', 'Joined']),
      allotted: p(ALLOTTED),
      confirmed: p(JOINED),
      joined: list.filter((s) => s.status === 'Joined').length,
    });
  }
  return points;
}

function aggregateWeekly(points: TrendPoint[]): TrendPoint[] {
  const weeks: TrendPoint[] = [];
  let current: TrendPoint | null = null;
  let weekStart = '';
  for (const p of points) {
    const date = new Date(p.date);
    const key = date.toISOString().slice(0, 10);
    if (!weekStart) weekStart = key;
    if (!current) {
      current = { ...p };
      current.label = weekStart;
    } else {
      const acc = (k: keyof Omit<TrendPoint, 'date' | 'label'>) =>
        (current![k] as number) + (p[k] as number);
      current.applications = acc('applications');
      current.registered = acc('registered');
      current.verified = acc('verified');
      current.allotted = acc('allotted');
      current.confirmed = acc('confirmed');
      current.joined = acc('joined');
    }
    if (date.getDay() === 6) {
      weeks.push(current);
      current = null;
      weekStart = '';
    }
  }
  if (current) weeks.push(current);
  return weeks.map((w, i) => ({ ...w, label: `Week ${i + 1}` }));
}

function aggregateMonthly(points: TrendPoint[]): TrendPoint[] {
  const byMonth = new Map<string, TrendPoint>();
  for (const p of points) {
    const key = p.date.slice(0, 7);
    const agg = byMonth.get(key) ?? { ...p, label: key, date: key };
    const acc = (k: keyof Omit<TrendPoint, 'date' | 'label'>) =>
      (agg[k] as number) + (p[k] as number);
    agg.applications = acc('applications');
    agg.registered = acc('registered');
    agg.verified = acc('verified');
    agg.allotted = acc('allotted');
    agg.confirmed = acc('confirmed');
    agg.joined = acc('joined');
    byMonth.set(key, agg);
  }
  return Array.from(byMonth.values());
}

function toCategory(list: { name: string; value: number; color?: string }[]): CategoryDatum[] {
  return list.map((x, i) => ({ name: x.name, value: x.value, color: x.color ?? CHART_COLORS[i % CHART_COLORS.length] }));
}

function kpi(key: string, label: string, value: number, extra?: Partial<KpiDefinition>): KpiDefinition {
  return { key, label, value, format: 'number', ...extra };
}

interface BaseFilters {
  academicYear?: string;
  round?: string;
  status?: string;
  community?: string;
  district?: string;
  gender?: string;
  search?: string;
}

export function filterStudents(students: Student[], f: BaseFilters): Student[] {
  return students.filter((s) => {
    if (f.academicYear && f.academicYear !== 'all' && s.academicYear !== f.academicYear) return false;
    if (f.round && f.round !== 'all' && s.round !== f.round) return false;
    if (f.status && f.status !== 'all' && s.status !== f.status) return false;
    if (f.community && f.community !== 'all' && s.community !== f.community) return false;
    if (f.district && f.district !== 'all' && s.district !== f.district) return false;
    if (f.gender && f.gender !== 'all' && s.gender !== f.gender) return false;
    if (f.search && f.search.trim()) {
      const q = f.search.toLowerCase();
      const hay = `${s.name} ${s.applicationNo} ${s.registerNo} ${s.district} ${s.community} ${s.schoolName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function facetStudents(rows: Student[]) {
  return {
    communities: distinct(rows.map((r) => r.community)).sort(),
    districts: distinct(rows.map((r) => r.district)).sort(),
    statuses: distinct(rows.map((r) => r.status)),
    rounds: distinct(rows.map((r) => r.round).filter(Boolean) as string[]).sort(),
    years: distinct(rows.map((r) => r.academicYear)).sort().reverse(),
  };
}

export function getOverview(year: string = CURRENT_ACADEMIC_YEAR, round?: string): OverviewPayload {
  const all = getAllStudents();
  const rows = filterStudents(all, { academicYear: year, round });
  const prev = filterStudents(all, { academicYear: year === '2023-24' ? year : String(Number(year.slice(0, 4)) - 1) + '-' + year.slice(2, 4), round });
  const prevTotal = prev.length || 1;

  const intake = 240;
  const seatsFilled = rows.filter((s) => JOINED.includes(s.status)).length;
  const vacant = Math.max(0, intake - seatsFilled);
  const admissionPct = intake ? (seatsFilled / intake) * 100 : 0;
  const confirmed = rows.filter((s) => JOINED.includes(s.status)).length;
  const allotted = rows.filter((s) => ALLOTTED.includes(s.status)).length;
  const confirmationRate = allotted ? (confirmed / allotted) * 100 : 0;

  const male = rows.filter((s) => s.gender === 'Male').length;
  const female = rows.filter((s) => s.gender === 'Female').length;

  const deltaOf = (current: number, prevV: number) => ((current - prevV) / prevV) * 100;

  return {
    kpis: [
      kpi('total', 'Total Applications', rows.length, {
        delta: deltaOf(rows.length, prevTotal),
        trend: rows.length >= prevTotal ? 'up' : 'down',
        hint: `vs ${year === '2023-24' ? 'baseline' : 'previous year'}`,
      }),
      kpi('intake', 'Seat Intake', intake, { format: 'number', hint: 'Sanctioned intake' }),
      kpi('filled', 'Seats Filled', seatsFilled, { hint: `of ${intake} sanctioned` }),
      kpi('vacant', 'Vacant Seats', vacant, {
        hint: `${((vacant / intake) * 100).toFixed(1)}% available`,
        trend: vacant > 0 ? 'up' : 'flat',
      }),
      kpi('admission', 'Admission Percentage', admissionPct, { format: 'percent' }),
      kpi('confirmation', 'Confirmation Rate', confirmationRate, { format: 'percent' }),
      kpi('male', 'Male Students', male),
      kpi('female', 'Female Students', female),
    ],
    applicationTrend: roundBuckets(rows),
    admissionTrend: aggregateWeekly(roundBuckets(all.filter((s) => s.academicYear === year))),
    categoryDistribution: toCategory(
      COMMUNITIES.map((c) => ({ name: c, value: rows.filter((s) => s.community === c).length, color: COMMUNITY_COLORS[c] })),
    ),
    genderDistribution: toCategory(
      GENDERS.map((g) => ({ name: g, value: rows.filter((s) => s.gender === g).length, color: GENDER_COLORS[g] })),
    ),
    roundDistribution: toCategory(
      ADMISSION_ROUNDS.map((r) => ({ name: r, value: rows.filter((s) => s.round === r).length })),
    ),
    statusDistribution: toCategory(
      [...new Set(rows.map((s) => s.status))].sort().map((st) => ({ name: st, value: rows.filter((s) => s.status === st).length, color: STATUS_COLORS[st as ApplicationStatus] })),
    ),
    seatUtilization: {
      intake,
      filled: seatsFilled,
      vacant,
      government: rows.filter((s) => s.quota === 'Government' && JOINED.includes(s.status)).length,
      management: rows.filter((s) => s.quota === 'Management' && JOINED.includes(s.status)).length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getApplications(params: Record<string, string>): ApplicationsPayload {
  const all = getAllStudents();
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(5, Number(params.pageSize ?? 10)));
  const sortBy = params.sortBy ?? 'appliedAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';

  const rows = filterStudents(all, {
    academicYear: params.academicYear,
    round: params.round,
    status: params.status,
    community: params.community,
    district: params.district,
    gender: params.gender,
    search: params.search,
  });

  const sorted = sortStudents(rows, sortBy, sortDir);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    rows: slice,
    total,
    page,
    pageSize,
    totalPages,
    facets: facetStudents(all),
    summary: {
      applied: rows.length,
      confirmed: rows.filter((s) => JOINED.includes(s.status)).length,
      joined: rows.filter((s) => s.status === 'Joined').length,
      rejected: rows.filter((s) => s.status === 'Rejected' || s.status === 'Not Interested').length,
    },
  };
}

export function getAnalytics(params: Record<string, string>): AnalyticsPayload {
  const all = getAllStudents();
  const rows = filterStudents(all, {
    academicYear: params.academicYear,
    round: params.round,
    community: params.community,
    gender: params.gender,
  });

  const buckets = [
    { label: 'Below 50%', min: 0, max: 50 },
    { label: '50-60%', min: 50, max: 60 },
    { label: '60-70%', min: 60, max: 70 },
    { label: '70-80%', min: 70, max: 80 },
    { label: '80-90%', min: 80, max: 90 },
    { label: '90-100%', min: 90, max: 101 },
  ].map((b) => ({
    bucket: b.label,
    min: b.min,
    max: b.max,
    count: rows.filter((s) => s.percentage >= b.min && s.percentage < b.max).length,
  }));

  const admitted = rows.filter((s) => JOINED.includes(s.status));
  const districtWise = DISTRICTS.map((d) => ({
    district: d,
    applications: rows.filter((s) => s.district === d).length,
    admitted: admitted.filter((s) => s.district === d).length,
  })).filter((d) => d.applications > 0).sort((a, b) => b.applications - a.applications).slice(0, 14);

  return {
    kpis: [
      kpi('applications', 'Total Applicants', rows.length),
      kpi('admitted', 'Admitted', admitted.length),
      kpi('avg', 'Average Cutoff', rows.length ? rows.reduce((s, r) => s + r.cutoff, 0) / rows.length : 0, {
        format: 'percent',
      }),
      kpi('highest', 'Highest Cutoff', rows.length ? Math.max(...rows.map((r) => r.cutoff)) : 0, { format: 'percent' }),
      kpi('lowest', 'Lowest Cutoff', rows.length ? Math.min(...rows.map((r) => r.cutoff)) : 0, { format: 'percent' }),
    ],
    communityDistribution: toCategory(
      COMMUNITIES.map((c) => ({ name: c, value: rows.filter((s) => s.community === c).length, color: COMMUNITY_COLORS[c] })),
    ),
    genderDistribution: toCategory(
      GENDERS.map((g) => ({ name: g, value: rows.filter((s) => s.gender === g).length, color: GENDER_COLORS[g] })),
    ),
    districtWise,
    percentageHistogram: buckets,
    schoolTypeDistribution: [...new Set(rows.map((s) => s.schoolType))]
      .map((t) => ({
        name: t,
        applications: rows.filter((s) => s.schoolType === t).length,
        admitted: admitted.filter((s) => s.schoolType === t).length,
      }))
      .sort((a, b) => b.applications - a.applications),
    statusBreakdown: toCategory(
      [...new Set(rows.map((s) => s.status))].map((st) => ({ name: st, value: rows.filter((s) => s.status === st).length, color: STATUS_COLORS[st as ApplicationStatus] })),
    ),
    roundBreakdown: toCategory(
      ADMISSION_ROUNDS.map((r) => ({ name: r, value: rows.filter((s) => s.round === r).length })),
    ),
    filters: {
      years: distinct(all.map((s) => s.academicYear)).sort().reverse(),
      rounds: ADMISSION_ROUNDS,
      communities: COMMUNITIES,
      genders: GENDERS,
    },
  };
}

export function getSeats(params: Record<string, string>): SeatAnalysisPayload {
  const all = getAllStudents();
  const year = params.academicYear ?? CURRENT_ACADEMIC_YEAR;
  const rows = filterStudents(all, { academicYear: year });

  const intake = 240;
  const govtQuota = 168;
  const mgmtQuota = 72;
  const filled = rows.filter((s) => JOINED.includes(s.status)).length;
  const vacant = Math.max(0, intake - filled);
  const occupancy = intake ? (filled / intake) * 100 : 0;

  const govtFilled = rows.filter((s) => s.quota === 'Government' && JOINED.includes(s.status)).length;
  const mgmtFilled = rows.filter((s) => s.quota === 'Management' && JOINED.includes(s.status)).length;

  const roundFilling = ADMISSION_ROUNDS.map((r) => {
    const inRound = rows.filter((s) => s.round === r);
    const allotted = inRound.length;
    const confirmed = inRound.filter((s) => s.status === 'Confirmed' || s.status === 'Joined').length;
    const joined = inRound.filter((s) => s.status === 'Joined').length;
    const cumulative = ADMISSION_ROUNDS.filter((x) => x <= r).reduce((sum, rr) => sum + rows.filter((s) => s.round === rr).length, 0);
    const vacantAfter = Math.max(0, intake - cumulative);
    return {
      round: r,
      allotted,
      confirmed,
      joined,
      vacantAfter,
      utilization: intake ? (cumulative / intake) * 100 : 0,
    };
  });

  const years = distinct(all.map((s) => s.academicYear)).sort().reverse();
  const history = years.map((y) => {
    const yrRows = filterStudents(all, { academicYear: y });
    const f = yrRows.filter((s) => JOINED.includes(s.status)).length;
    return { year: y, intake, filled: f, occupancy: intake ? (f / intake) * 100 : 0 };
  });

  const yearlyBreakdown = years.map((y) => {
    const yrRows = filterStudents(all, { academicYear: y });
    const g = yrRows.filter((s) => s.quota === 'Government' && JOINED.includes(s.status)).length;
    const m = yrRows.filter((s) => s.quota === 'Management' && JOINED.includes(s.status)).length;
    return { year: y, government: g, management: m, total: g + m, occupied: g + m };
  });

  return {
    kpis: [
      kpi('intake', 'Sanctioned Intake', intake),
      kpi('govt', 'Government Quota', govtQuota),
      kpi('mgmt', 'Management Quota', mgmtQuota),
      kpi('filled', 'Seats Filled', filled),
      kpi('vacant', 'Vacant Seats', vacant),
      kpi('occupancy', 'Occupancy', occupancy, { format: 'percent' }),
    ],
    intake,
    governmentQuota: govtQuota,
    managementQuota: mgmtQuota,
    filled,
    vacant,
    occupancy,
    quotaDonut: toCategory([
      { name: 'Government Filled', value: govtFilled, color: QUOTA_COLORS.Government },
      { name: 'Management Filled', value: mgmtFilled, color: QUOTA_COLORS.Management },
      { name: 'Vacant', value: vacant, color: '#cbd5e1' },
    ]),
    roundFilling,
    compare: [
      { label: 'Government', available: govtQuota, utilized: govtFilled },
      { label: 'Management', available: mgmtQuota, utilized: mgmtFilled },
    ],
    history,
    yearlyBreakdown,
    filters: { years, rounds: ADMISSION_ROUNDS },
  };
}

export function getTrends(params: Record<string, string>): TrendsPayload {
  const all = getAllStudents();
  const year = params.academicYear ?? CURRENT_ACADEMIC_YEAR;
  const rows = filterStudents(all, { academicYear: year, round: params.round });

  const daily = roundBuckets(rows);
  const series = daily;
  const weekly = aggregateWeekly(daily);
  const monthly = aggregateMonthly(daily);

  const confirmed = rows.filter((s) => JOINED.includes(s.status)).length;
  const conversion = rows.length ? (confirmed / rows.length) * 100 : 0;
  const peaks = daily.map((d) => ({ date: d.label, count: d.applications })).sort((a, b) => b.count - a.count).slice(0, 5);
  const peakDay = peaks[0] ?? { date: '', count: 0 };
  const avgDaily = rows.length ? Math.round(rows.length / Math.max(1, daily.length)) : 0;
  const bestWeek = weekly.reduce((best, w) => (w.applications > (best?.applications ?? 0) ? w : best), weekly[0]);

  const stageFunnel = toCategory([
    { name: 'Applied', value: rows.length, color: STATUS_COLORS.Applied },
    { name: 'Registered', value: rows.filter((s) => REGISTERED.includes(s.status)).length, color: STATUS_COLORS['Counselling Registered'] },
    { name: 'Allotted', value: rows.filter((s) => ALLOTTED.includes(s.status)).length, color: STATUS_COLORS.Allotted },
    { name: 'Confirmed', value: confirmed, color: STATUS_COLORS.Confirmed },
    { name: 'Joined', value: rows.filter((s) => s.status === 'Joined').length, color: STATUS_COLORS.Joined },
  ]);

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayPattern = weekdayNames.map((day, i) => ({
    day,
    value: daily.filter((d) => new Date(d.date).getDay() === i).reduce((s, d) => s + d.applications, 0),
  }));

  return {
    metrics: [
      kpi('total', 'Total Applications', rows.length),
      kpi('confirmed', 'Confirmed Admissions', confirmed),
      kpi('conversion', 'Conversion Rate', conversion, { format: 'percent' }),
      kpi('peak', `Peak Day (${peakDay.date})`, peakDay.count, { hint: 'highest daily applications' }),
      kpi('avgDaily', 'Average Daily', avgDaily),
      kpi('bestWeek', 'Best Week', bestWeek?.applications ?? 0, { hint: bestWeek?.label }),
    ],
    series,
    daily,
    weekly,
    monthly,
    peaks,
    stageFunnel,
    weekdayPattern,
    filters: {
      years: distinct(all.map((s) => s.academicYear)).sort().reverse(),
      rounds: ADMISSION_ROUNDS,
    },
  };
}

export function searchStudents(params: Record<string, string>): StudentSearchPayload {
  const all = getAllStudents();
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(params.pageSize ?? 10)));
  const sortBy = params.sortBy ?? 'appliedAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';

  const rows = filterStudents(all, {
    search: params.search,
    district: params.district,
    community: params.community,
    status: params.status,
    gender: params.gender,
  });

  const sorted = sortStudents(rows, sortBy, sortDir);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    rows: slice,
    total,
    page,
    pageSize,
    totalPages,
    facets: {
      districts: distinct(all.map((s) => s.district)).sort(),
      communities: COMMUNITIES,
      statuses: distinct(all.map((s) => s.status)).sort(),
      genders: GENDERS,
    },
  };
}

export function getReports(): ReportsPayload {
  const reports: ReportsPayload['reports'] = [
    {
      id: 'admission-summary',
      name: 'Admission Summary',
      description: 'Consolidated summary of all admissions including intake, filled seats, vacancies and conversion metrics.',
      category: 'Summary',
      icon: 'FileSpreadsheet',
      formats: ['PDF', 'Excel', 'CSV'],
      size: '~1.2 MB',
      suggested: true,
    },
    {
      id: 'student-list',
      name: 'Student List',
      description: 'Complete roster of applicants with personal, academic and admission status details for the selected year.',
      category: 'Roster',
      icon: 'Users',
      formats: ['PDF', 'Excel', 'CSV'],
      size: '~3.4 MB',
      suggested: true,
    },
    {
      id: 'category-report',
      name: 'Category Report',
      description: 'Community-wise distribution of applicants and admissions across all reserved categories.',
      category: 'Analytics',
      icon: 'Layers',
      formats: ['PDF', 'Excel'],
      size: '~0.8 MB',
      suggested: false,
    },
    {
      id: 'district-report',
      name: 'District Report',
      description: 'District-wise applicant and admission statistics with conversion analysis.',
      category: 'Analytics',
      icon: 'MapPin',
      formats: ['PDF', 'Excel'],
      size: '~1.1 MB',
      suggested: false,
    },
    {
      id: 'cutoff-analysis',
      name: 'Cut-Off Analysis',
      description: 'Round-wise cutoff trends, percentile distribution and score band analysis.',
      category: 'Analytics',
      icon: 'Gauge',
      formats: ['PDF', 'Excel'],
      size: '~0.9 MB',
      suggested: false,
    },
    {
      id: 'seat-matrix',
      name: 'Seat Matrix Report',
      description: 'Quota-wise seat matrix with sanctioned intake, utilization and vacancy positions.',
      category: 'Summary',
      icon: 'Grid3X3',
      formats: ['PDF', 'Excel'],
      size: '~0.6 MB',
      suggested: false,
    },
  ];

  const history = [
    {
      id: 'gen-1',
      reportId: 'admission-summary',
      reportName: 'Admission Summary',
      format: 'PDF' as const,
      generatedBy: 'R. Kavitha',
      generatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      size: '1.2 MB',
      status: 'Ready' as const,
      rows: 1453,
    },
    {
      id: 'gen-2',
      reportId: 'student-list',
      reportName: 'Student List',
      format: 'Excel' as const,
      generatedBy: 'Dr. S. Murugan',
      generatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      size: '3.4 MB',
      status: 'Ready' as const,
      rows: 1297,
    },
    {
      id: 'gen-3',
      reportId: 'category-report',
      reportName: 'Category Report',
      format: 'PDF' as const,
      generatedBy: 'R. Kavitha',
      generatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      size: '0.8 MB',
      status: 'Ready' as const,
      rows: 7,
    },
    {
      id: 'gen-4',
      reportId: 'district-report',
      reportName: 'District Report',
      format: 'Excel' as const,
      generatedBy: 'Dr. S. Murugan',
      generatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      size: '1.1 MB',
      status: 'Ready' as const,
      rows: 35,
    },
  ];

  return { reports, history };
}

export function getHod(year: string = CURRENT_ACADEMIC_YEAR): HodPayload {
  const all = getAllStudents();
  const rows = filterStudents(all, { academicYear: year });

  const allotted = rows.filter((s) => ALLOTTED.includes(s.status)).length;
  const verified = rows.filter((s) => ['Verified', 'Allotted', 'Confirmed', 'Joined'].includes(s.status)).length;
  const pendingVerification = rows.filter((s) => ['Applied', 'Counselling Registered'].includes(s.status)).length;
  const joined = rows.filter((s) => s.status === 'Joined').length;
  const intake = 240;
  const vacant = Math.max(0, intake - joined);
  const utilization = intake ? (joined / intake) * 100 : 0;

  const recent = sortStudents(rows.filter((s) => JOINED.includes(s.status)), 'admittedAt', 'desc').slice(0, 8);

  const queue = rows
    .filter((s) => ['Applied', 'Counselling Registered'].includes(s.status))
    .slice(0, 8)
    .map((s) => {
      const daysPending = Math.max(1, Math.floor((Date.now() - new Date(s.appliedAt).getTime()) / 86400000));
      return {
        id: s.id,
        student: s.name,
        applicationNo: s.applicationNo,
        category: s.community,
        cutoff: s.cutoff,
        submittedAt: s.appliedAt,
        daysPending,
        priority: (daysPending > 14 ? 'high' : daysPending > 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      };
    });

  const roundTargets: Record<string, number> = { 'Round 1': 50, 'Round 2': 40, 'Round 3': 30, 'Round 4': 120 };
  const roundProgress = ADMISSION_ROUNDS.map((r) => {
    const achieved = rows.filter((s) => s.round === r && JOINED.includes(s.status)).length;
    const target = roundTargets[r];
    return { round: r, target, achieved, percentage: Math.min(100, (achieved / target) * 100) };
  });

  return {
    kpis: [
      kpi('allotted', 'Students Allotted', allotted),
      kpi('pending', 'Pending Verification', pendingVerification),
      kpi('verified', 'Verified Students', verified),
      kpi('vacant', 'Vacant Seats', vacant),
      kpi('utilization', 'Seat Utilization', utilization, { format: 'percent' }),
    ],
    recentAdmissions: recent,
    verificationQueue: queue,
    pendingActions: [
      { id: 'verify', title: 'Verify Pending Applications', description: `${pendingVerification} applications awaiting document verification`, count: pendingVerification, tone: 'brand' as const },
      { id: 'confirm', title: 'Confirm Allotted Seats', description: 'Follow up on candidates allotted in recent rounds', count: rows.filter((s) => s.status === 'Allotted').length, tone: 'amber' as const },
      { id: 'review', title: 'Review Rejected Applications', description: 'Applications flagged or rejected require review', count: rows.filter((s) => s.status === 'Rejected').length, tone: 'rose' as const },
      { id: 'export', title: 'Department Report Export', description: 'Generate the monthly departmental progress report', count: 1, tone: 'emerald' as const },
    ],
    roundProgress,
    statusBreakdown: [...new Set(rows.map((s) => s.status))].map((st) => ({
      name: st,
      value: rows.filter((s) => s.status === st).length,
      color: STATUS_COLORS[st as ApplicationStatus],
    })),
    admissionCurve: roundBuckets(rows),
    filters: {
      years: distinct(all.map((s) => s.academicYear)).sort().reverse(),
      rounds: ADMISSION_ROUNDS,
    },
  };
}

export function getSummary(year: string = CURRENT_ACADEMIC_YEAR): SummaryPayload {
  const all = getAllStudents();
  const rows = filterStudents(all, { academicYear: year });

  const intake = 240;
  const joined = rows.filter((s) => s.status === 'Joined').length;
  const confirmed = rows.filter((s) => JOINED.includes(s.status)).length;
  const vacant = Math.max(0, intake - joined);
  const male = rows.filter((s) => s.gender === 'Male').length;
  const female = rows.filter((s) => s.gender === 'Female').length;

  const districtTop = DISTRICTS.map((d) => {
    const applications = rows.filter((s) => s.district === d).length;
    const admitted = rows.filter((s) => s.district === d && JOINED.includes(s.status)).length;
    return { district: d, applications, admitted, conversion: applications ? (admitted / applications) * 100 : 0 };
  }).filter((d) => d.applications > 0).sort((a, b) => b.admitted - a.admitted).slice(0, 10);

  return {
    generatedAt: new Date().toISOString(),
    academicYear: year,
    kpis: [
      kpi('applications', 'Total Applications', rows.length),
      kpi('intake', 'Seat Intake', intake),
      kpi('filled', 'Seats Filled', joined),
      kpi('vacant', 'Vacant Seats', vacant),
      kpi('admission', 'Admission Percentage', intake ? (joined / intake) * 100 : 0, { format: 'percent' }),
      kpi('confirmation', 'Confirmation Rate', confirmed && rows.length ? (confirmed / rows.length) * 100 : 0, { format: 'percent' }),
      kpi('male', 'Male Students', male),
      kpi('female', 'Female Students', female),
    ],
    roundComparison: ADMISSION_ROUNDS.map((r) => {
      const inRound = rows.filter((s) => s.round === r);
      return {
        round: r,
        applied: inRound.length,
        allotted: inRound.filter((s) => ALLOTTED.includes(s.status)).length,
        joined: inRound.filter((s) => s.status === 'Joined').length,
      };
    }),
    categoryComparison: COMMUNITIES.map((c) => ({ name: c, value: rows.filter((s) => s.community === c).length, color: COMMUNITY_COLORS[c] })),
    genderComparison: GENDERS.map((g) => ({ name: g, value: rows.filter((s) => s.gender === g).length, color: GENDER_COLORS[g] })),
    districtTop,
    trendSeries: aggregateWeekly(roundBuckets(rows)),
    statusBreakdown: [...new Set(rows.map((s) => s.status))].map((st) => ({ name: st, value: rows.filter((s) => s.status === st).length, color: STATUS_COLORS[st as ApplicationStatus] })),
    seatMatrix: QUOTAS.map((q) => {
      const quotaIntake = q === 'Government' ? 168 : 72;
      const filled = rows.filter((s) => s.quota === q && JOINED.includes(s.status)).length;
      return { quota: q, intake: quotaIntake, filled, vacant: Math.max(0, quotaIntake - filled), utilization: quotaIntake ? (filled / quotaIntake) * 100 : 0 };
    }),
  };
}

export { getStudentById, buildStudentProfile, getAllStudents, COUNSELLING_WINDOWS, YEAR_APPLICATIONS };
