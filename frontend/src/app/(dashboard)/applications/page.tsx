'use client';

import { createColumnHelper, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Download, Eye, FileDown, Filter, MoreHorizontal, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CutoffPill, QuotaBadge, RoundBadge, StatusBadge } from '@/components/ui/status-badge';
import { ADMISSION_ROUNDS, APPLICATION_STATUSES, COMMUNITIES, DISTRICTS } from '@/constants';
import { useApplications } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/date';
import { exportToCsv } from '@/utils/export';
import { toast } from '@/store/toast-store';
import type { Student } from '@/types';


const columnHelper = createColumnHelper<Student>();

const columnDefs = {
  applicant: columnHelper.accessor('name', {
    header: 'Applicant',
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <UserRound className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">{row.original.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{row.original.applicationNo}</p>
        </div>
      </div>
    ),
  }),
  registerNo: columnHelper.accessor('registerNo', {
    header: 'Reg. No',
    cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue()}</span>,
  }),
  community: columnHelper.accessor('community', {
    header: 'Community',
    cell: ({ getValue }) => <Badge tone={getValue() === 'OC' ? 'neutral' : 'blue'}>{getValue()}</Badge>,
  }),
  district: columnHelper.accessor('district', { header: 'District' }),
  gender: columnHelper.accessor('gender', {
    header: 'Gender',
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
  cutoff: columnHelper.accessor('cutoff', {
    header: 'Cutoff',
    cell: ({ getValue }) => <CutoffPill cutoff={getValue()} />,
  }),
  status: columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  round: columnHelper.accessor('round', {
    header: 'Round',
    cell: ({ getValue }) => <RoundBadge round={getValue() ?? ''} />,
  }),
  quota: columnHelper.accessor('quota', {
    header: 'Quota',
    cell: ({ getValue }) => <QuotaBadge quota={getValue()} />,
  }),
  appliedAt: columnHelper.accessor('appliedAt', {
    header: 'Applied',
    cell: ({ getValue }) => <span className="text-muted-foreground">{formatDate(getValue(), 'dd MMM yyyy')}</span>,
  }),
};

const allColumnKeys = [
  'applicant',
  'registerNo',
  'community',
  'district',
  'gender',
  'cutoff',
  'status',
  'round',
  'quota',
  'appliedAt',
  'actions',
] as const;

export default function ApplicationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'appliedAt', desc: true }]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(allColumnKeys));

  const [filters, setFilters] = useState({
    academicYear: '',
    round: '',
    status: '',
    community: '',
    district: '',
    gender: '',
  });

  const sortBy = sorting[0]?.id ?? 'appliedAt';
  const sortDir = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isPending, refetch } = useApplications({
    page,
    pageSize,
    sortBy,
    sortDir,
    search: debouncedSearch,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  });

  const columns = useMemo((): ColumnDef<Student, any>[] => {
    const map = {
      applicant: columnDefs.applicant,
      registerNo: columnDefs.registerNo,
      community: columnDefs.community,
      district: columnDefs.district,
      gender: columnDefs.gender,
      cutoff: columnDefs.cutoff,
      status: columnDefs.status,
      round: columnDefs.round,
      quota: columnDefs.quota,
      appliedAt: columnDefs.appliedAt,
      actions: columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              align="end"
              width="sm"
              trigger={
                <button aria-label="Row actions" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
              items={[
                {
                  key: 'view',
                  label: 'View profile',
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onSelect: () => router.push(`/students/${row.original.id}`),
                },
                {
                  key: 'export',
                  label: 'Export record',
                  icon: <FileDown className="h-3.5 w-3.5" />,
                  onSelect: () => {
                    exportToCsv(
                      `student-${row.original.applicationNo}`,
                      [
                        { header: 'Field', key: 'field' },
                        { header: 'Value', key: 'value' },
                      ],
                      Object.entries({
                        'Application No': row.original.applicationNo,
                        'Register No': row.original.registerNo,
                        Name: row.original.name,
                        Gender: row.original.gender,
                        Community: row.original.community,
                        District: row.original.district,
                        Cutoff: row.original.cutoff.toFixed(2),
                        Status: row.original.status,
                        Round: row.original.round ?? '—',
                        Quota: row.original.quota,
                      }).map(([field, value]) => ({ field, value })),
                    );
                    toast('Record exported', { tone: 'success', description: `${row.original.name} exported as CSV.` });
                  },
                },
              ]}
            />
          </div>
        ),
      }),
    };
    return allColumnKeys.filter((k) => visibleColumns.has(k)).map((k) => map[k]);
  }, [visibleColumns, router]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleExport = () => {
    if (!data?.rows.length) {
      toast('Nothing to export', { tone: 'warning', description: 'No matching records in the current view.' });
      return;
    }
    exportToCsv(
      `applications-${data.page}-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: 'Application No', key: 'applicationNo' },
        { header: 'Register No', key: 'registerNo' },
        { header: 'Name', key: 'name' },
        { header: 'Gender', key: 'gender' },
        { header: 'Community', key: 'community' },
        { header: 'District', key: 'district' },
        { header: 'Cutoff', key: 'cutoff' },
        { header: 'Status', key: 'status' },
        { header: 'Round', key: 'round' },
        { header: 'Quota', key: 'quota' },
        { header: 'Applied At', key: 'appliedAt' },
      ],
      data.rows.map((r) => ({
        applicationNo: r.applicationNo,
        registerNo: r.registerNo,
        name: r.name,
        gender: r.gender,
        community: r.community,
        district: r.district,
        cutoff: r.cutoff.toFixed(2),
        status: r.status,
        round: r.round ?? '',
        quota: r.quota,
        appliedAt: formatDate(r.appliedAt),
      })),
    );
    toast(`Exported ${data.rows.length} records`, { tone: 'success', description: 'The current page has been exported as CSV.' });
  };

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ academicYear: '', round: '', status: '', community: '', district: '', gender: '' });
    setSearch('');
    setPage(1);
  };

  const filterSelect = (
    key: keyof typeof filters,
    label: string,
    options: { value: string; label: string }[],
    allLabel: string,
  ) => (
    <Select
      aria-label={label}
      value={filters[key]}
      onChange={(e) => setFilter(key, e.target.value)}
      options={[{ value: '', label: allLabel }, ...options]}
      className="h-8.5 w-full text-xs"
    />
  );

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Manage and review TNEA applications with server-side pagination, sorting, and advanced filtering."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'Management', href: '/applications' }, { label: 'Applications' }]}
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export CSV
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            placeholder="Search by name, application no, register no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onDebouncedChange={setSearch}
            className="w-full sm:w-80"
          />
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            size="md"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Dropdown
            width="sm"
            align="start"
            trigger={
              <Button variant="outline" leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
                Columns
              </Button>
            }
          >
            <div className="px-1 py-0.5">
              {allColumnKeys.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(key)}
                    onChange={(e) => {
                      const next = new Set(visibleColumns);
                      if (e.target.checked) next.add(key);
                      else next.delete(key);
                      setVisibleColumns(next);
                    }}
                    className="h-3.5 w-3.5 rounded border-input text-brand-600 accent-brand-600"
                  />
                  {key === 'applicant' ? 'Applicant' : key.replace(/^./, (c) => c.toUpperCase())}
                </label>
              ))}
            </div>
          </Dropdown>
          {data && (
            <p className="ml-auto hidden text-xs text-muted-foreground md:block">
              {data.summary.applied.toLocaleString()} matched ·{' '}
              <span className="font-medium text-foreground">{data.summary.confirmed} confirmed</span>
            </p>
          )}
        </div>

        {showFilters && (
          <div className="animate-fade-in rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advanced filters</p>
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {filterSelect('academicYear', 'Academic year', [
                ...(data?.facets.years.map((y) => ({ value: y, label: y })) ?? []),
              ], 'All years')}
              {filterSelect('round', 'Admission round', ADMISSION_ROUNDS.map((r) => ({ value: r, label: r })), 'All rounds')}
              {filterSelect('status', 'Application status', APPLICATION_STATUSES.map((s) => ({ value: s, label: s })), 'All statuses')}
              {filterSelect('community', 'Community', COMMUNITIES.map((c) => ({ value: c, label: c })), 'All communities')}
              {filterSelect('district', 'District', DISTRICTS.map((d) => ({ value: d, label: d })), 'All districts')}
              {filterSelect('gender', 'Gender', [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }], 'All genders')}
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isPending && !data}
        loadingRows={pageSize}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/students/${row.id}`)}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={{
          page,
          pageSize,
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
          onPageChange: (p) => {
            setPage(p);
            refetch();
          },
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
      />
    </div>
  );
}
