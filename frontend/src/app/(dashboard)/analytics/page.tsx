'use client';

import { BarChart3, Filter, MapPin, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart } from '@/components/charts/bar-chart';
import { ChartCard, ChartLegend } from '@/components/charts/chart-card';
import { DonutChart, PieChart } from '@/components/charts/donut-chart';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/ui/kpi-card';
import { ErrorState } from '@/components/ui/empty-state';
import { CURRENT_ACADEMIC_YEAR } from '@/constants';
import { useAnalytics } from '@/hooks/queries';
import { formatNumber } from '@/utils/format';

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [round, setRound] = useState('');
  const [community, setCommunity] = useState('');
  const [gender, setGender] = useState('');

  const { data, isPending, isError } = useAnalytics({ academicYear: year, round, community, gender });

  const activeFilters = [round, community, gender].filter(Boolean);
  const clearAll = () => {
    setRound('');
    setCommunity('');
    setGender('');
  };

  const communityLegend = useMemo(
    () => (data?.communityDistribution ?? []).map((d) => ({ label: d.name, color: d.color, value: d.value })),
    [data],
  );

  const histogramColors = useMemo(() => {
    if (!data) return [];
    const counts = data.percentageHistogram.map((h) => h.count);
    const max = Math.max(...counts, 1);
    return counts.map((c) => {
      const intensity = 0.35 + (c / max) * 0.65;
      return `rgba(99, 102, 241, ${intensity.toFixed(2)})`;
    });
  }, [data]);

  const selectedCommunityData = useMemo(() => {
    if (!community || !data) return [];
    return data.districtWise.slice(0, 8);
  }, [community, data]);

  return (
    <div>
      <PageHeader
        title="Student Analytics"
        description="Demographic and academic performance analysis of applicants. Click any chart segment to drill down."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Student Analytics' }]}
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
              options={[{ label: 'All rounds', value: '' }, ...(data?.filters.rounds.map((r) => ({ label: r, value: r })) ?? [])]}
              className="h-9 w-[120px]"
            />
            <Select
              aria-label="Community"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              options={[{ label: 'All communities', value: '' }, ...(data?.filters.communities.map((c) => ({ label: c, value: c })) ?? [])]}
              className="h-9 w-[140px]"
            />
            <Select
              aria-label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[{ label: 'All genders', value: '' }, ...(data?.filters.genders.map((g) => ({ label: g, value: g })) ?? [])]}
              className="h-9 w-[120px]"
            />
          </div>
        }
      />

      {isError && !data ? (
        <ErrorState title="Unable to load analytics" description="The analytics service could not be reached." onRetry={() => queryClient.invalidateQueries({ queryKey: ['analytics'] })} />
      ) : (
        <div className="space-y-6">
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-2.5 dark:border-brand-900 dark:bg-brand-950/40">
              <Filter className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-medium text-foreground">Active filters:</span>
              {round && <Badge tone="brand">Round · {round}</Badge>}
              {community && <Badge tone="brand">Community · {community}</Badge>}
              {gender && <Badge tone="brand">Gender · {gender}</Badge>}
              <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {(data?.kpis ?? Array.from({ length: 5 }, (_, i) => ({ key: `analytics-kpi-${i}`, label: '', value: 0, format: 'number' as const, hint: '' }))).map((k) => (
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard
              title="Community Distribution"
              subtitle="Click a segment to filter by community"
              loading={isPending && !data}
              action={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            >
              {data && (
                <>
                  <DonutChart
                    data={data.communityDistribution}
                    height={220}
                    centerLabel="Applicants"
                    centerValue={data.communityDistribution.reduce((s, d) => s + d.value, 0)}
                    onClickSlice={(d) => setCommunity(d.name === community ? '' : d.name)}
                    activeIndex={community ? data.communityDistribution.findIndex((c) => c.name === community) : undefined}
                  />
                  <ChartLegend items={communityLegend} />
                </>
              )}
            </ChartCard>

            <ChartCard title="Gender Ratio" subtitle="Male vs female applicants" loading={isPending && !data}>
              {data && (
                <div className="flex items-center justify-center gap-8">
                  <PieChart data={data.genderDistribution} height={220} />
                  <div className="space-y-3">
                    {data.genderDistribution.map((d) => {
                      const pct = data.genderDistribution.reduce((s, x) => s + x.value, 0)
                        ? (d.value / data.genderDistribution.reduce((s, x) => s + x.value, 0)) * 100
                        : 0;
                      return (
                        <div key={d.name} className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-muted-foreground">{d.name}</span>
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {d.value} <span className="text-xs font-normal text-muted-foreground">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="District-wise Admissions" subtitle="Top districts by application volume" loading={isPending && !data} className="min-h-[360px]">
              <BarChart
                data={(data?.districtWise ?? []).map((d) => ({ name: d.district, Applications: d.applications, Admitted: d.admitted }))}
                xKey="name"
                horizontal
                height={320}
                bars={[
                  { key: 'Applications', name: 'Applications', color: '#6366f1' },
                  { key: 'Admitted', name: 'Admitted', color: '#22d3ee' },
                ]}
              />
            </ChartCard>

            <ChartCard title="12th Percentage Distribution" subtitle="Histogram of applicant academic performance" loading={isPending && !data}>
              <BarChart
                data={(data?.percentageHistogram ?? []).map((h) => ({ name: h.bucket, count: h.count }))}
                xKey="name"
                bars={[{ key: 'count', name: 'Students', color: '#6366f1' }]}
                cellColors={histogramColors}
                height={320}
                barSize={34}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard
              title="School Type Analysis"
              subtitle="Applications vs admitted by school type"
              loading={isPending && !data}
              className="xl:col-span-2"
            >
              <BarChart
                data={(data?.schoolTypeDistribution ?? []).map((d) => ({ name: d.name, Applications: d.applications, Admitted: d.admitted }))}
                xKey="name"
                height={300}
                stacked
                bars={[
                  { key: 'Applications', name: 'Applications', color: '#a5b4fc' },
                  { key: 'Admitted', name: 'Admitted', color: '#6366f1' },
                ]}
              />
            </ChartCard>

            <ChartCard title="Status Breakdown" subtitle="Applicants by current status" loading={isPending && !data}>
              {data && (
                <div className="space-y-2.5 pt-1">
                  {data.statusBreakdown.map((s) => {
                    const max = Math.max(...data.statusBreakdown.map((x) => x.value), 1);
                    return (
                      <div key={s.name} className="flex items-center gap-3">
                        <span className="w-32 truncate text-xs text-muted-foreground">{s.name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s.value / max) * 100}%`, backgroundColor: s.color }} />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold tabular-nums text-foreground">{s.value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>
          </div>

          {community && data && selectedCommunityData.length > 0 && (
            <div className="animate-fade-in rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-foreground">Drill-down: {community} applicants by district</h3>
                <Badge tone="brand">{community}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {selectedCommunityData.map((d) => (
                  <div key={d.district} className="rounded-lg bg-muted/60 p-3">
                    <p className="truncate text-xs text-muted-foreground">{d.district}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{formatNumber(d.applications)}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{d.admitted} admitted</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
