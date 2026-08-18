'use client';

import { Download, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AreaChart } from '@/components/charts/area-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { ChartCard } from '@/components/charts/chart-card';
import { DateRangePicker, type DateRangeValue } from '@/components/filters/date-range';
import { SegmentControl } from '@/components/filters/segment-control';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { KpiCard } from '@/components/ui/kpi-card';
import { ErrorState } from '@/components/ui/empty-state';
import { ADMISSION_ROUNDS, CURRENT_ACADEMIC_YEAR } from '@/constants';
import { useTrends } from '@/hooks/queries';
import { formatDate } from '@/utils/date';
import { formatPercent } from '@/utils/format';
import { exportToCsv } from '@/utils/export';
import { toast } from '@/store/toast-store';

export default function AdmissionTrendsPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [round, setRound] = useState('');
  const [granularity, setGranularity] = useState('daily');
  const [range, setRange] = useState<DateRangeValue>({ from: '2026-05-22', to: '2026-08-08' });

  const { data, isPending, isError } = useTrends(year, round);

  const seriesForGranularity = granularity === 'weekly' ? data?.weekly : granularity === 'monthly' ? data?.monthly : data?.daily;

  const labelFor = (d: { date: string; label: string }) =>
    granularity === 'daily' ? formatDate(d.date, 'dd MMM') : d.label;

  const filteredSeries = (seriesForGranularity ?? [])
    .map((t) => ({ ...t, label: labelFor(t) }))
    .filter((t) => (granularity === 'daily' ? t.date.slice(0, 10) >= range.from && t.date.slice(0, 10) <= range.to : true));

  const handleExport = () => {
    if (!data) return;
    exportToCsv(
      `admission-trends-${year}-${granularity}`,
      [
        { header: 'Period', key: 'period' },
        { header: 'Applications', key: 'applications' },
        { header: 'Registered', key: 'registered' },
        { header: 'Verified', key: 'verified' },
        { header: 'Allotted', key: 'allotted' },
        { header: 'Confirmed', key: 'confirmed' },
        { header: 'Joined', key: 'joined' },
      ],
      filteredSeries.map((t) => ({ period: t.label, applications: t.applications, registered: t.registered, verified: t.verified, allotted: t.allotted, confirmed: t.confirmed, joined: t.joined })),
    );
    toast('Trend report exported', { tone: 'success', description: `${granularity} series exported as CSV.` });
  };

  return (
    <div>
      <PageHeader
        title="Admission Trends"
        description="Time-series analysis of applications and admissions with daily, weekly, and monthly granularity."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'Analytics', href: '/admission-trends' }, { label: 'Admission Trends' }]}
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
        <ErrorState title="Unable to load trends" description="The trends service could not be reached." onRetry={() => queryClient.invalidateQueries({ queryKey: ['trends'] })} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {(data?.metrics ?? Array.from({ length: 6 }, (_, i) => ({ key: `trend-metric-${i}`, label: '', value: 0, format: 'number' as const, hint: '' }))).map((k) => (
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

          <ChartCard
            title="Admission Flow Over Time"
            subtitle="Track applications through the admission pipeline"
            loading={isPending && !data}
            className="min-h-[420px]"
            action={
              <div className="flex flex-col items-end gap-2">
                <SegmentControl
                  label=""
                  options={[
                    { label: 'Daily', value: 'daily' },
                    { label: 'Weekly', value: 'weekly' },
                    { label: 'Monthly', value: 'monthly' },
                  ]}
                  value={granularity}
                  onChange={setGranularity}
                />
              </div>
            }
          >
            {granularity === 'daily' && (
              <div className="mb-3">
                <DateRangePicker value={range} onChange={setRange} />
              </div>
            )}
            <AreaChart
              data={filteredSeries}
              xKey="label"
              series={[
                { key: 'applications', name: 'Applications', color: '#6366f1' },
                { key: 'confirmed', name: 'Confirmed', color: '#10b981' },
                { key: 'joined', name: 'Joined', color: '#22d3ee' },
              ]}
              height={granularity === 'daily' ? 300 : 320}
              brush={granularity === 'daily'}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="Admission Stage Funnel" subtitle="Conversion across admission stages" loading={isPending && !data}>
              <BarChart
                data={(data?.stageFunnel ?? []).map((d) => ({ name: d.name, count: d.value }))}
                xKey="name"
                bars={[{ key: 'count', name: 'Applicants', color: '#6366f1' }]}
                cellColors={data?.stageFunnel.map((d) => d.color)}
                height={300}
              />
            </ChartCard>

            <ChartCard title="Weekday Application Pattern" subtitle="Applications received by day of week" loading={isPending && !data}>
              <BarChart
                data={(data?.weekdayPattern ?? []).map((d) => ({ name: d.day.slice(0, 3), count: d.value }))}
                xKey="name"
                bars={[{ key: 'count', name: 'Applications', color: '#22d3ee' }]}
                height={300}
              />
            </ChartCard>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Peak Admission Days</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Highest daily application volumes during the counselling period</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Rank</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Applications</th>
                    <th className="px-5 py-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.peaks ?? []).map((p, i) => {
                    const total = data?.metrics[0]?.value ?? 1;
                    return (
                      <tr key={p.date} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] font-medium text-foreground">{formatDate(p.date)}</td>
                        <td className="px-5 py-3 text-[13px] font-semibold tabular-nums text-foreground">{p.count}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{formatPercent((p.count / total) * 100)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
