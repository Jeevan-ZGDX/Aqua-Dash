'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AreaChart } from '@/components/charts/area-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { ChartCard, ChartLegend } from '@/components/charts/chart-card';
import { DonutChart } from '@/components/charts/donut-chart';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { KpiCard } from '@/components/ui/kpi-card';
import { Tooltip } from '@/components/ui/tooltip';
import { ErrorState } from '@/components/ui/empty-state';
import { ACADEMIC_YEARS, ADMISSION_ROUNDS, CHART_COLORS, CURRENT_ACADEMIC_YEAR } from '@/constants';
import { useOverview } from '@/hooks/queries';
import { formatDate, formatDateTime } from '@/utils/date';
import { exportToCsv } from '@/utils/export';
import { toast } from '@/store/toast-store';

export default function OverviewPage() {
  const [year, setYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [round, setRound] = useState('all');
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useOverview(year, round);

  const handleExport = () => {
    if (!data) return;
    exportToCsv(
      `admission-overview-${year}`,
      [
        { header: 'Metric', key: 'metric' },
        { header: 'Value', key: 'value' },
      ],
      data.kpis.map((k) => ({ metric: k.label, value: k.value.toFixed(2) })),
    );
    toast('Overview exported', { tone: 'success', description: 'KPI summary exported as CSV.' });
  };

  const genderLegend = useMemo(
    () =>
      data?.genderDistribution.map((d) => ({
        label: d.name,
        color: d.color,
        value: d.value,
      })) ?? [],
    [data],
  );

  const categoryLegend = useMemo(
    () =>
      data?.categoryDistribution.map((d) => ({
        label: d.name,
        color: d.color,
        value: d.value,
      })) ?? [],
    [data],
  );

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Executive summary of admission activity for the CSE department across the current counselling cycle."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'Dashboard', href: '/overview' }, { label: 'Overview' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Academic year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={ACADEMIC_YEARS.map((y) => ({ label: y, value: y }))}
              className="h-9 w-[130px]"
            />
            <Select
              aria-label="Admission round"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              options={[{ label: 'All rounds', value: 'all' }, ...ADMISSION_ROUNDS.map((r) => ({ label: r, value: r }))]}
              className="h-9 w-[130px]"
            />
            <Tooltip content="Refresh">
              <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh data">
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
            <Button variant="outline" size="md" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export
            </Button>
          </div>
        }
      />

      {isError && !data ? (
        <ErrorState
          title="Unable to load overview"
          description="The analytics service could not be reached. Please try again."
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['overview'] })}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {(data?.kpis ?? Array.from({ length: 8 }, (_, i) => ({ key: `kpi-${i}`, label: '', value: 0, delta: undefined, trend: undefined, hint: '', format: 'number' as const }))).map((k) => (
              <KpiCard
                key={k.key}
                label={k.label ?? ''}
                value={k.value ?? 0}
                delta={k.delta}
                trend={k.trend}
                hint={k.hint}
                format={k.format}
                loading={isPending && !data}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard
              title="Application Trends"
              subtitle="Applications received per day"
              loading={isPending && !data}
              className="xl:col-span-2"
              action={
                <span className="text-xs text-muted-foreground">
                  {data ? formatDateTime(data.generatedAt) : ''}
                </span>
              }
            >
              <AreaChart
                data={(data?.applicationTrend ?? []).map((t) => ({ ...t, label: formatDate(t.date, 'dd MMM') }))}
                xKey="label"
                series={[{ key: 'applications', name: 'Applications', color: CHART_COLORS[0] }]}
                height={300}
              />
            </ChartCard>

            <ChartCard title="Category Distribution" subtitle="Community-wise applicants" loading={isPending && !data}>
              {data && (
                <>
                  <DonutChart
                    data={data.categoryDistribution}
                    height={200}
                    centerLabel="Applicants"
                    centerValue={data.categoryDistribution.reduce((s, d) => s + d.value, 0)}
                  />
                  <ChartLegend items={categoryLegend} />
                </>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard
              title="Admission Trends"
              subtitle="Weekly admissions across the counselling cycle"
              loading={isPending && !data}
              className="xl:col-span-2"
            >
              <AreaChart
                data={(data?.admissionTrend ?? []).map((t) => ({ ...t, label: t.label }))}
                xKey="label"
                series={[
                  { key: 'confirmed', name: 'Confirmed', color: CHART_COLORS[2] },
                  { key: 'joined', name: 'Joined', color: CHART_COLORS[3] },
                ]}
                height={280}
              />
            </ChartCard>

            <ChartCard title="Gender Distribution" subtitle="Male vs female applicants" loading={isPending && !data}>
              {data && (
                <>
                  <DonutChart
                    data={data.genderDistribution}
                    height={200}
                    centerLabel="Total"
                    centerValue={data.genderDistribution.reduce((s, d) => s + d.value, 0)}
                  />
                  <ChartLegend items={genderLegend} />
                </>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard title="Status Distribution" subtitle="Applicants by current admission status" loading={isPending && !data} className="xl:col-span-2">
              <BarChart
                data={(data?.statusDistribution ?? []).map((d) => ({ name: d.name, count: d.value }))}
                xKey="name"
                bars={[{ key: 'count', name: 'Applicants', color: CHART_COLORS[4] }]}
                cellColors={data?.statusDistribution.map((d) => d.color)}
                height={280}
              />
            </ChartCard>

            <ChartCard title="Seat Utilization" subtitle={`Sanctioned intake · ${data?.seatUtilization.intake ?? 240} seats`} loading={isPending && !data}>
              {data && (
                <div className="space-y-5 pt-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Overall occupancy</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {((data.seatUtilization.filled / data.seatUtilization.intake) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(data.seatUtilization.filled / data.seatUtilization.intake) * 100} tone="brand" showLabel />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Government quota</span>
                      <span className="font-semibold tabular-nums text-foreground">{data.seatUtilization.government}</span>
                    </div>
                    <Progress value={(data.seatUtilization.government / 168) * 100} tone="sky" showLabel />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Management quota</span>
                      <span className="font-semibold tabular-nums text-foreground">{data.seatUtilization.management}</span>
                    </div>
                    <Progress value={(data.seatUtilization.management / 72) * 100} tone="amber" showLabel />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{data.seatUtilization.filled}</p>
                      <p className="text-xs text-muted-foreground">Seats filled</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{data.seatUtilization.vacant}</p>
                      <p className="text-xs text-muted-foreground">Vacant seats</p>
                    </div>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
