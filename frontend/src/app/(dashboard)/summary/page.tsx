'use client';

import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useState } from 'react';
import { BarChart } from '@/components/charts/bar-chart';
import { ChartCard, ChartLegend } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { LineChart } from '@/components/charts/line-chart';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/ui/kpi-card';
import { ErrorState } from '@/components/ui/empty-state';
import { CURRENT_ACADEMIC_YEAR } from '@/constants';
import { useSummary } from '@/hooks/queries';
import { formatDateTime, formatDate } from '@/utils/date';
import { exportToExcel, exportToPdf } from '@/utils/export';
import { toast } from '@/store/toast-store';
import { COLLEGE_NAME, DEPARTMENT, APP_NAME } from '@/constants';

export default function SummaryPage() {
  const [year, setYear] = useState(CURRENT_ACADEMIC_YEAR);
  const { data, isPending, isError, refetch } = useSummary(year);

  const exportPdf = () => {
    if (!data) return;
    exportToPdf(
      `executive-summary-${year}`,
      {
        title: 'Admissions Executive Summary',
        subtitle: `${DEPARTMENT} · ${year} · TNEA Counselling`,
        generatedAt: formatDateTime(data.generatedAt),
      },
      [
        { title: 'Key Metrics', columns: ['Metric', 'Value'], rows: data.kpis.map((k) => [k.label, k.value.toFixed(2)]) },
        {
          title: 'Round-wise Comparison',
          columns: ['Round', 'Applied', 'Allotted', 'Joined'],
          rows: data.roundComparison.map((r) => [r.round, r.applied, r.allotted, r.joined]),
        },
        {
          title: 'District-wise Top 10',
          columns: ['District', 'Applications', 'Admitted', 'Conversion %'],
          rows: data.districtTop.map((d) => [d.district, d.applications, d.admitted, d.conversion.toFixed(1)]),
        },
        {
          title: 'Seat Matrix',
          columns: ['Quota', 'Intake', 'Filled', 'Vacant', 'Utilization %'],
          rows: data.seatMatrix.map((s) => [s.quota, s.intake, s.filled, s.vacant, s.utilization.toFixed(1)]),
        },
      ],
    );
    toast('PDF exported', { tone: 'success', description: 'Executive summary saved as a PDF report.' });
  };

  const exportExcel = () => {
    if (!data) return;
    exportToExcel(`executive-summary-${year}`, [
      {
        name: 'KPI Summary',
        columns: [{ header: 'Metric', key: 'metric' }, { header: 'Value', key: 'value' }],
        rows: data.kpis.map((k) => ({ metric: k.label, value: k.value.toFixed(2) })),
      },
      {
        name: 'Rounds',
        columns: [{ header: 'Round', key: 'round' }, { header: 'Applied', key: 'applied' }, { header: 'Allotted', key: 'allotted' }, { header: 'Joined', key: 'joined' }],
        rows: data.roundComparison.map((r) => ({ round: r.round, applied: r.applied, allotted: r.allotted, joined: r.joined })),
      },
      {
        name: 'Districts',
        columns: [{ header: 'District', key: 'district' }, { header: 'Applications', key: 'applications' }, { header: 'Admitted', key: 'admitted' }, { header: 'Conversion %', key: 'conversion' }],
        rows: data.districtTop.map((d) => ({ district: d.district, applications: d.applications, admitted: d.admitted, conversion: d.conversion.toFixed(1) })),
      },
      {
        name: 'Seat Matrix',
        columns: [{ header: 'Quota', key: 'quota' }, { header: 'Intake', key: 'intake' }, { header: 'Filled', key: 'filled' }, { header: 'Vacant', key: 'vacant' }],
        rows: data.seatMatrix.map((s) => ({ quota: s.quota, intake: s.intake, filled: s.filled, vacant: s.vacant })),
      },
    ]);
    toast('Excel exported', { tone: 'success', description: 'Executive summary saved as an Excel workbook.' });
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Analytics Summary & Export"
          description="Consolidated executive report of all admission statistics, optimized for printing and distribution."
          loading={isPending && !data}
          breadcrumbs={[{ label: 'System', href: '/summary' }, { label: 'Summary & Export' }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Academic year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                options={['2023-24', '2024-25', '2025-26', '2026-27'].map((y) => ({ label: y, value: y }))}
                className="h-9 w-[120px]"
              />
              <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                Print
              </Button>
              <Button variant="outline" leftIcon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel}>
                Excel
              </Button>
              <Button leftIcon={<Download className="h-4 w-4" />} onClick={exportPdf}>
                Export PDF
              </Button>
            </div>
          }
        />
      </div>

      {isError && !data ? (
        <div className="print:hidden">
          <ErrorState title="Unable to load summary" description="The summary service could not be reached." onRetry={refetch} />
        </div>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Executive Summary</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {COLLEGE_NAME} · {DEPARTMENT} · Academic Year {data?.academicYear ?? year}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Generated on {data ? formatDateTime(data.generatedAt) : '…'}</p>
                <p>Source: {APP_NAME}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {(data?.kpis ?? Array.from({ length: 8 }, (_, i) => ({ key: `summary-kpi-${i}`, label: '', value: 0, format: 'number' as const, hint: '' }))).map((k) => (
                <KpiCard key={k.key} label={k.label ?? ''} value={k.value ?? 0} format={k.format} hint={k.hint} loading={isPending && !data} />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Round-wise Comparison" subtitle="Applied, allotted, and joined across counselling rounds" loading={isPending && !data}>
              <BarChart
                data={(data?.roundComparison ?? []).map((r) => ({ name: r.round, Applied: r.applied, Allotted: r.allotted, Joined: r.joined }))}
                xKey="name"
                height={300}
                bars={[
                  { key: 'Applied', name: 'Applied', color: '#a5b4fc' },
                  { key: 'Allotted', name: 'Allotted', color: '#818cf8' },
                  { key: 'Joined', name: 'Joined', color: '#6366f1' },
                ]}
              />
            </ChartCard>

            <ChartCard title="Weekly Admission Trend" subtitle="Applications and admissions over the counselling period" loading={isPending && !data}>
              <LineChart
                data={(data?.trendSeries ?? []).map((t) => ({ ...t, label: t.label }))}
                xKey="label"
                series={[
                  { key: 'applications', name: 'Applications', color: '#6366f1' },
                  { key: 'joined', name: 'Joined', color: '#10b981' },
                ]}
                height={300}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard title="Category Distribution" subtitle="Community-wise applicants" loading={isPending && !data}>
              {data && (
                <>
                  <DonutChart data={data.categoryComparison} height={220} centerLabel="Applicants" centerValue={data.categoryComparison.reduce((s, d) => s + d.value, 0)} />
                  <ChartLegend items={data.categoryComparison.map((d) => ({ label: d.name, color: d.color, value: d.value }))} />
                </>
              )}
            </ChartCard>

            <ChartCard title="Gender Distribution" subtitle="Male vs female applicants" loading={isPending && !data}>
              {data && (
                <DonutChart
                  data={data.genderComparison}
                  height={220}
                  centerLabel="Total"
                  centerValue={data.genderComparison.reduce((s, d) => s + d.value, 0)}
                />
              )}
            </ChartCard>

            <ChartCard title="Status Breakdown" subtitle="Applicants by current admission status" loading={isPending && !data}>
              <div className="space-y-2.5 pt-1">
                {(data?.statusBreakdown ?? []).map((s) => {
                  const max = Math.max(...(data?.statusBreakdown ?? []).map((x) => x.value), 1);
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="w-36 truncate text-xs text-muted-foreground">{s.name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${(s.value / max) * 100}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold tabular-nums text-foreground">{s.value}</span>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Top Districts by Admissions</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Applications, admissions, and conversion rate by district</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">District</th>
                    <th className="px-5 py-3">Applications</th>
                    <th className="px-5 py-3">Admitted</th>
                    <th className="px-5 py-3">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.districtTop ?? []).map((d, i) => (
                    <tr key={d.district} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] font-medium text-foreground">{d.district}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-foreground">{d.applications}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-foreground">{d.admitted}</td>
                      <td className="px-5 py-3">
                        <Badge tone={d.conversion >= 20 ? 'emerald' : d.conversion >= 10 ? 'blue' : 'amber'}>{d.conversion.toFixed(1)}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Seat Matrix</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Sanctioned intake, occupancy, and vacancies by quota</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Quota</th>
                    <th className="px-5 py-3">Intake</th>
                    <th className="px-5 py-3">Filled</th>
                    <th className="px-5 py-3">Vacant</th>
                    <th className="px-5 py-3">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.seatMatrix ?? []).map((s) => (
                    <tr key={s.quota} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-[13px] font-medium text-foreground">{s.quota}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-foreground">{s.intake}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-foreground">{s.filled}</td>
                      <td className="px-5 py-3 text-[13px] tabular-nums text-rose-600 dark:text-rose-400">{s.vacant}</td>
                      <td className="px-5 py-3">
                        <Badge tone={s.utilization >= 90 ? 'emerald' : s.utilization >= 60 ? 'blue' : 'amber'}>{s.utilization.toFixed(0)}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-muted/40 px-5 py-3 text-right text-xs text-muted-foreground">
              Confidential · For departmental use only · Generated on {data ? formatDate(data.generatedAt) : '—'}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
