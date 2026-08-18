'use client';

import { createColumnHelper, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { SearchX, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CutoffPill, StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { COMMUNITIES, DISTRICTS } from '@/constants';
import { useStudentSearch } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/date';
import type { Student } from '@/types';

const columnHelper = createColumnHelper<Student>();

const columns: ColumnDef<Student, any>[] = [
  columnHelper.accessor('name', {
    header: 'Student',
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
  columnHelper.accessor('registerNo', {
    header: 'Register No',
    cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{getValue()}</span>,
  }),
  columnHelper.accessor('community', {
    header: 'Community',
    cell: ({ getValue }) => <Badge tone="blue">{getValue()}</Badge>,
  }),
  columnHelper.accessor('district', { header: 'District' }),
  columnHelper.accessor('cutoff', {
    header: 'Cutoff',
    cell: ({ getValue }) => <CutoffPill cutoff={getValue()} />,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  columnHelper.accessor('appliedAt', {
    header: 'Applied',
    cell: ({ getValue }) => <span className="text-muted-foreground">{formatDate(getValue(), 'dd MMM yyyy')}</span>,
  }),
];

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'appliedAt', desc: true }]);
  const [filters, setFilters] = useState({ district: '', community: '', status: '', gender: '' });

  const sortBy = sorting[0]?.id ?? 'appliedAt';
  const sortDir = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isPending, isFetching } = useStudentSearch({
    search: debouncedSearch,
    page,
    pageSize,
    sortBy,
    sortDir,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  });

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const searching = Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

  return (
    <div>
      <PageHeader
        title="Student Search"
        description="Locate any applicant instantly by register number, application number, name, district, or community."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'Management', href: '/students' }, { label: 'Student Search' }]}
      />

      <div className="mb-4 flex flex-col gap-3">
        <SearchInput
          placeholder="Search by name, register no, application no, district…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onDebouncedChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          className="w-full sm:w-[440px]"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
          <Select
            aria-label="District"
            value={filters.district}
            onChange={(e) => setFilter('district', e.target.value)}
            options={[{ value: '', label: 'All districts' }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            aria-label="Community"
            value={filters.community}
            onChange={(e) => setFilter('community', e.target.value)}
            options={[{ value: '', label: 'All communities' }, ...COMMUNITIES.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            aria-label="Status"
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              ...(data?.facets.statuses.map((s) => ({ value: s, label: s })) ?? []),
            ]}
          />
          <Select
            aria-label="Gender"
            value={filters.gender}
            onChange={(e) => setFilter('gender', e.target.value)}
            options={[
              { value: '', label: 'All genders' },
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isPending && !data}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/students/${row.id}`)}
        sorting={sorting}
        onSortingChange={setSorting}
        emptyState={
          searching ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" />}
              title="No students match your search"
              description={`No applicants found for "${debouncedSearch || 'current filters'}". Try a different name, number, or clear filters.`}
            />
          ) : (
            <EmptyState
              title="Search to get started"
              description="Type a name, register number, or application number to find applicants across all academic years."
            />
          )
        }
        pagination={{
          page,
          pageSize,
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
      />

      {isFetching && data && (
        <p className="mt-2 text-xs text-muted-foreground">Updating results…</p>
      )}
    </div>
  );
}
