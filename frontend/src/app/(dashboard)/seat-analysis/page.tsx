'use client';

import { Armchair, Download } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart } from '@/components/charts/bar-chart';
import { LineChart } from '@/components/charts/line-chart';
import { ChartCard, ChartLegend } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { KpiCard } from '@/components/ui/kpi-card';
import { ErrorState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { ADMISSION_ROUNDS, CURRENT_ACADEMIC_YEAR } from '@/constants';
import { useSeats } from '@/hooks/queries';
import { formatPercent } from '@/utils/format';
import { exportToCsv } from '@/utils/export';
import { toast } from '@/store/toast-store';

export default function SeatAnalysisPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [round, setRound] = useState('');
  const { data, isPending, isError } = useSeats(year, round);

  const handleExport = () => {
    if (!data) return;
    exportToCsv(
      `seat-matrix-${year}`,
      [
        { header: 'Quota', key: 'quota' },
        { header: 'Intake', key: 'intake' },
        { header: 'Filled', key: 'filled' },
        { header: 'Vacant', key: 'vacant' },
        { header: 'Utilization %', key: 'utilization' },
      ],
      [
        { quota: 'Government', intake: data.governmentQuota, filled: data.compare[0].utilized, vacant: data.governmentQuota - data.compare[0].utilized, utilization: ((data.compare[0].utilized / data.governmentQuota) * 100).toFixed(1) },
        { quota: 'Management', intake: data.managementQuota, filled: data.compare[1].utilized, vacant: data.managementQuota - data.compare[1].utilized, utilization: ((data.compare[1].utilized / data.managementQuota) * 100).toFixed(1) },
        { quota: 'Total', intake: data.intake, filled: data.filled, vacant: data.vacant, utilization: data.occupancy.toFixed(1) },
      ],
    );
    toast('Seat matrix exported', { tone: 'success', description: 'Seat allocation data exported as CSV.' });
  };

  return (
    <div>
      <PageHeader
        title="Seat Analysis"
        description="Seat allocation analytics across government and management quotas with round-wise filling patterns."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'Analytics', href: '/seat-analysis' }, { label: 'Seat Analysis' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Academic year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={data?.filters.years.map((y) => ({ label: y, value: y })) ?? []}
              className="h-9 w-[120px]"
            />
            <Select
              aria-label="Admission round"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              options={[{ label: 'All rounds', value: '' }, ...ADMISSION_ROUNDS.map((r) => ({ label: r, value: r }))]}
              className="h-9 w-[120px]"
            />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export
            </Button>
          </div>
        }
      />

      {isError && !data ? (
        <ErrorState title="Unable to load seat data" description="The seat analysis service could not be reached." onRetry={() => queryClient.invalidateQueries({ queryKey: ['seats'] })} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {(data?.kpis ?? Array.from({ length: 6 }, (_, i) => ({ key: `seat-kpi-${i}`, label: '', value: 0, format: 'number' as const, hint: '' }))).map((k) => (
              <KpiCard
                key={k.key}
                label={k.label ?? ''}
                value={k.value ?? 0}
                format={k.format}
                hint={k.hint}
                loading={isPending && !data}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard title="Quota-wise Distribution" subtitle="Filled seats by quota" loading={isPending && !data}>
              {data && (
                <>
                  <DonutChart
                    data={data.quotaDonut}
                    height={220}
                    centerLabel="Occupancy"
                    centerValue={formatPercent(data.occupancy, 0)}
                  />
                  <ChartLegend
                    items={data.quotaDonut.map((d) => ({ label: d.name, color: d.color, value: d.value }))}
                  />
                </>
              )}
            </ChartCard>

            <ChartCard title="Available vs Utilized" subtitle="Quota comparison" loading={isPending && !data} className="xl:col-span-2">
              <BarChart
                data={data?.compare.map((c) => ({ name: c.label, Available: c.available, Utilized: c.utilized })) ?? []}
                xKey="name"
                height={300}
                bars={[
                  { key: 'Available', name: 'Available', color: '#c7d2fe' },
                  { key: 'Utilized', name: 'Utilized', color: '#6366f1' },
                ]}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard title="Occupancy Progress" subtitle="Seat utilization by quota" loading={isPending && !data}>
              {data && (
                <div className="space-y-5 pt-2">
                  {data.compare.map((c) => (
                    <div key={c.label}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Armchair className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{c.label}</span>
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {c.utilized}/{c.available}
                        </span>
                      </div>
                      <Progress value={(c.utilized / c.available) * 100} tone={c.label === 'Government' ? 'sky' : 'amber'} showLabel />
                    </div>
                  ))}
                  <div className="rounded-lg bg-muted/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Overall occupancy</span>
                      <span className="text-xl font-semibold tabular-nums text-foreground">{formatPercent(data.occupancy)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {data.filled} of {data.intake} sanctioned seats filled
                    </p>
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Historical Occupancy Trend" subtitle="Seat fill rate across academic years" loading={isPending && !data} className="xl:col-span-2">
              <LineChart
                data={(data?.history ?? []).map((h) => ({ name: h.year, Occupancy: h.occupancy }))}
                xKey="name"
                series={[{ key: 'Occupancy', name: 'Occupancy %', color: '#6366f1' }]}
                height={300}
                dots
                valueFormatter={(v) => formatPercent(v, 0)}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Round-wise Seat Filling" subtitle="Allotment and confirmation progression across counselling rounds" loading={isPending && !data}>
              <BarChart
                data={(data?.roundFilling ?? []).map((r) => ({ name: r.round, Allotted: r.allotted, Confirmed: r.confirmed, Joined: r.joined }))}
                xKey="name"
                height={280}
                bars={[
                  { key: 'Allotted', name: 'Allotted', color: '#818cf8' },
                  { key: 'Confirmed', name: 'Confirmed', color: '#22d3ee' },
                  { key: 'Joined', name: 'Joined', color: '#10b981' },
                ]}
              />
            </ChartCard>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Yearly Seat Breakdown</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Government and management quota occupancy by academic year</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Year</th>
                    <th className="px-5 py-3">Government</th>
                    <th className="px-5 py-3">Management</th>
                    <th className="px-5 py-3">Total Occupied</th>
                    <th className="px-5 py-3">Vacant</th>
                    <th className="px-5 py-3">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.yearlyBreakdown ?? []).map((row) => (
                    <tr key={row.year} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-[13px] font-medium text-foreground">{row.year}</td>
                      <td className="px-5 py-3 text-[13px] text-foreground">{row.government}</td>
                      <td className="px-5 py-3 text-[13px] text-foreground">{row.management}</td>
                      <td className="px-5 py-3 text-[13px] font-medium text-foreground">{row.occupied}</td>
                      <td className="px-5 py-3 text-[13px] text-rose-600 dark:text-rose-400">{Math.max(0, 240 - row.occupied)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={(row.occupied / 240) * 100 >= 90 ? 'emerald' : (row.occupied / 240) * 100 >= 60 ? 'blue' : 'amber'}>
                          {((row.occupied / 240) * 100).toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
