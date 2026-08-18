'use client';

import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart } from '@/components/charts/area-chart';
import { ChartCard } from '@/components/charts/chart-card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { KpiCard } from '@/components/ui/kpi-card';
import { CutoffPill, StatusBadge } from '@/components/ui/status-badge';
import { useHod } from '@/hooks/queries';
import { useSession } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { formatDate, timeAgo } from '@/utils/date';

function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">HOD access required</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        This dashboard is restricted to the Head of Department. Sign in with an HOD account to continue.
      </p>
    </div>
  );
}

const toneIcons = { brand: ClipboardCheck, amber: AlertCircle, rose: ShieldAlert, emerald: Download };

export default function HodDashboardPage() {
  const router = useRouter();
  const session = useSession();
  const [year, setYear] = useState('2026-27');
  const { data, isPending, isError } = useHod(year);

  const isHod = session?.user.role === 'HOD';

  if (session && !isHod) {
    return (
      <div>
        <PageHeader title="HOD Dashboard" breadcrumbs={[{ label: 'System', href: '/hod' }, { label: 'HOD Dashboard' }]} />
        <AccessDenied />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="HOD Dashboard"
        description="Department-centric admission oversight for the Head of Department."
        loading={isPending && !data}
        breadcrumbs={[{ label: 'System', href: '/hod' }, { label: 'HOD Dashboard' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Academic year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={data?.filters.years.map((y) => ({ label: y, value: y })) ?? []}
              className="h-9 w-[120px]"
            />
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => toast('Department report requested', { tone: 'info', description: 'The export queue will process your request shortly.' })}
            >
              Export report
            </Button>
          </div>
        }
      />

      {isError && !data ? (
        <ErrorState title="Unable to load HOD data" description="The department overview could not be reached." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {(data?.kpis ?? Array.from({ length: 5 }, (_, i) => ({ key: `fallback-${i}`, label: '', value: 0, format: 'number' as const, hint: '' }))).map((k) => (
              <KpiCard key={k.key} label={k.label ?? ''} value={k.value ?? 0} format={k.format} hint={k.hint} loading={isPending && !data} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ChartCard
              title="Admission Curve"
              subtitle="Daily department admissions"
              loading={isPending && !data}
              className="xl:col-span-2"
            >
              <AreaChart
                data={(data?.admissionCurve ?? []).map((t) => ({ ...t, label: formatDate(t.date, 'dd MMM') }))}
                xKey="label"
                series={[
                  { key: 'applications', name: 'Applications', color: '#6366f1' },
                  { key: 'joined', name: 'Joined', color: '#10b981' },
                ]}
                height={280}
              />
            </ChartCard>

            <ChartCard title="Round-wise Progress" subtitle="Target vs achieved admissions" loading={isPending && !data}>
              <div className="space-y-4 pt-1">
                {(data?.roundProgress ?? []).map((r) => (
                  <div key={r.round}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{r.round}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {r.achieved}/{r.target}
                      </span>
                    </div>
                    <Progress value={r.percentage} tone={r.percentage >= 80 ? 'emerald' : r.percentage >= 50 ? 'brand' : 'amber'} showLabel />
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Admissions</CardTitle>
                  <CardDescription>Latest students who joined the department</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/applications')}>
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2.5">Student</th>
                        <th className="px-2 py-2.5">Cutoff</th>
                        <th className="px-2 py-2.5">Status</th>
                        <th className="px-2 py-2.5">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentAdmissions ?? []).map((s) => (
                        <tr key={s.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40" onClick={() => router.push(`/students/${s.id}`)}>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-foreground">{s.name}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{s.applicationNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3"><CutoffPill cutoff={s.cutoff} /></td>
                          <td className="px-2 py-3"><StatusBadge status={s.status} /></td>
                          <td className="px-2 py-3 text-xs text-muted-foreground">{timeAgo(s.admittedAt ?? s.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
                <CardDescription>Items requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.pendingActions ?? []).map((action) => {
                    const Icon = toneIcons[action.tone];
                    return (
                      <div key={action.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-foreground">{action.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        <Badge tone={action.tone === 'brand' ? 'blue' : action.tone === 'amber' ? 'amber' : action.tone === 'rose' ? 'rose' : 'emerald'}>
                          {action.count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Verification Queue</CardTitle>
                <CardDescription>Applications pending document verification</CardDescription>
              </div>
              <Button
                size="sm"
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => toast('Verification in progress', { tone: 'info', description: 'Opening the bulk verification workflow.' })}
              >
                Bulk verify
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2.5">Applicant</th>
                      <th className="px-2 py-2.5">Application No</th>
                      <th className="px-2 py-2.5">Category</th>
                      <th className="px-2 py-2.5">Cutoff</th>
                      <th className="px-2 py-2.5">Submitted</th>
                      <th className="px-2 py-2.5">Priority</th>
                      <th className="px-2 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.verificationQueue ?? []).map((q) => (
                      <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={q.student} size="sm" />
                            <span className="text-[13px] font-medium text-foreground">{q.student}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{q.applicationNo}</td>
                        <td className="px-2 py-3"><Badge tone="blue">{q.category}</Badge></td>
                        <td className="px-2 py-3"><CutoffPill cutoff={q.cutoff} /></td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">{timeAgo(q.submittedAt)}</td>
                        <td className="px-2 py-3">
                          <Badge tone={q.priority === 'high' ? 'rose' : q.priority === 'medium' ? 'amber' : 'neutral'} dot>
                            {q.priority}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                            onClick={() =>
                              toast('Application verified', {
                                tone: 'success',
                                description: `${q.student} has been marked as verified.`,
                              })
                            }
                          >
                            Verify
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
