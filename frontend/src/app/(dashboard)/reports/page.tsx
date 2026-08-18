'use client';

import {
  Download,
  FileBarChart,
  FileSpreadsheet,
  Gauge,
  Grid3X3,
  History,
  Layers,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Dropdown } from '@/components/ui/dropdown';
import { api } from '@/services/api';
import { useReports } from '@/hooks/queries';
import { useSession } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { formatDateTime, timeAgo } from '@/utils/date';
import { exportToExcel, exportToPdf, exportToCsv, type ExportRow } from '@/utils/export';
import type { GeneratedReport, ReportDefinition } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

const reportIcons: Record<string, typeof FileBarChart> = {
  'admission-summary': FileSpreadsheet,
  'student-list': Users,
  'category-report': Layers,
  'district-report': MapPin,
  'cutoff-analysis': Gauge,
  'seat-matrix': Grid3X3,
};

const progressSteps = ['Fetching data', 'Compiling metrics', 'Building layout', 'Finalizing document'];

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const { data, isPending, isError } = useReports();
  const [generating, setGenerating] = useState<Record<string, { format: string; step: number }>>({});
  const [history, setHistory] = useState<GeneratedReport[]>(data?.history ?? []);

  const allHistory = useMemo(() => {
    const local = history;
    const remote = data?.history ?? [];
    const map = new Map<string, GeneratedReport>();
    for (const item of remote) map.set(item.id, item);
    for (const item of local) map.set(item.id, item);
    return Array.from(map.values());
  }, [history, data]);

  const runGeneration = async (report: ReportDefinition, format: 'PDF' | 'Excel' | 'CSV') => {
    const reportId = report.id;
    setGenerating((g) => ({ ...g, [reportId]: { format, step: 0 } }));
    try {
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 450));
        setGenerating((g) => ({ ...g, [reportId]: { format, step: i + 1 } }));
      }
      await buildReportFile(report.id, report.name, format);
      const record: GeneratedReport = {
        id: `gen-${Date.now()}`,
        reportId: report.id,
        reportName: report.name,
        format,
        generatedBy: session?.user.name ?? 'System',
        generatedAt: new Date().toISOString(),
        size: format === 'PDF' ? '~1.2 MB' : format === 'Excel' ? '~2.1 MB' : '~0.4 MB',
        status: 'Ready',
        rows: 0,
      };
      setHistory((h) => [record, ...h]);
      toast(`${report.name} generated`, {
        tone: 'success',
        description: `${format} report exported successfully.`,
      });
    } catch (err) {
      toast('Report generation failed', {
        tone: 'error',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setGenerating((g) => {
        const next = { ...g };
        delete next[reportId];
        return next;
      });
    }
  };

  const buildReportFile = async (reportId: string, reportName: string, format: 'PDF' | 'Excel' | 'CSV') => {
    const year = '2026-27';
    const summary = await api.getSummary(year);

    const meta = {
      title: reportName,
      subtitle: `Computer Science Engineering · ${year} · TNEA Counselling`,
      generatedAt: formatDateTime(new Date()),
    };

    const kpiRows = summary.kpis.map((k) => [k.label, k.value.toFixed(2)]);

    if (format === 'PDF') {
      if (reportId === 'admission-summary') {
        exportToPdf('admission-summary-report', meta, [
          { title: 'Key Metrics', columns: ['Metric', 'Value'], rows: kpiRows },
          {
            title: 'Round-wise Comparison',
            columns: ['Round', 'Applied', 'Allotted', 'Joined'],
            rows: summary.roundComparison.map((r) => [r.round, r.applied, r.allotted, r.joined]),
          },
        ]);
      } else if (reportId === 'category-report') {
        exportToPdf('category-report', meta, [
          { title: 'Category Distribution', columns: ['Category', 'Applicants'], rows: summary.categoryComparison.map((c) => [c.name, c.value]) },
        ]);
      } else if (reportId === 'district-report') {
        exportToPdf('district-report', meta, [
          {
            title: 'District-wise Admissions',
            columns: ['District', 'Applications', 'Admitted', 'Conversion %'],
            rows: summary.districtTop.map((d) => [d.district, d.applications, d.admitted, d.conversion.toFixed(1)]),
          },
        ]);
      } else if (reportId === 'cutoff-analysis') {
        exportToPdf('cutoff-analysis', meta, [
          { title: 'Round-wise Cut-off Analysis', columns: ['Round', 'Applied', 'Allotted', 'Joined'], rows: summary.roundComparison.map((r) => [r.round, r.applied, r.allotted, r.joined]) },
        ]);
      } else if (reportId === 'seat-matrix') {
        exportToPdf('seat-matrix-report', meta, [
          {
            title: 'Seat Matrix',
            columns: ['Quota', 'Intake', 'Filled', 'Vacant', 'Utilization %'],
            rows: summary.seatMatrix.map((s) => [s.quota, s.intake, s.filled, s.vacant, s.utilization.toFixed(1)]),
          },
        ]);
      } else {
        exportToPdf('student-list', meta, [
          { title: 'Student Roster', columns: ['Name', 'Application No', 'Community', 'District', 'Status'], rows: [] },
        ], 'landscape');
        toast('Student list export uses the full roster', { tone: 'info' });
      }
    } else if (format === 'Excel') {
      const sheets: { name: string; columns: { header: string; key: string }[]; rows: ExportRow[] }[] = [
        {
          name: 'Summary',
          columns: [{ header: 'Metric', key: 'metric' }, { header: 'Value', key: 'value' }],
          rows: summary.kpis.map((k) => ({ metric: k.label, value: k.value.toFixed(2) })),
        },
        {
          name: 'Rounds',
          columns: [{ header: 'Round', key: 'round' }, { header: 'Applied', key: 'applied' }, { header: 'Allotted', key: 'allotted' }, { header: 'Joined', key: 'joined' }],
          rows: summary.roundComparison.map((r) => ({ round: r.round, applied: r.applied, allotted: r.allotted, joined: r.joined })),
        },
        {
          name: 'Categories',
          columns: [{ header: 'Category', key: 'category' }, { header: 'Applicants', key: 'applicants' }],
          rows: summary.categoryComparison.map((c) => ({ category: c.name, applicants: c.value })),
        },
        {
          name: 'Seat Matrix',
          columns: [{ header: 'Quota', key: 'quota' }, { header: 'Intake', key: 'intake' }, { header: 'Filled', key: 'filled' }, { header: 'Vacant', key: 'vacant' }],
          rows: summary.seatMatrix.map((s) => ({ quota: s.quota, intake: s.intake, filled: s.filled, vacant: s.vacant })),
        },
      ];
      if (reportId === 'student-list') {
        const apps = await api.getApplications({ page: 1, pageSize: 100, sortBy: 'appliedAt', sortDir: 'desc' });
        sheets.unshift({
          name: 'Student List',
          columns: [
            { header: 'Application No', key: 'applicationNo' },
            { header: 'Name', key: 'name' },
            { header: 'Community', key: 'community' },
            { header: 'District', key: 'district' },
            { header: 'Cutoff', key: 'cutoff' },
            { header: 'Status', key: 'status' },
          ],
          rows: apps.rows.map((r) => ({ applicationNo: r.applicationNo, name: r.name, community: r.community, district: r.district, cutoff: r.cutoff.toFixed(2), status: r.status })),
        });
      }
      exportToExcel(reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sheets);
    } else {
      exportToCsv(
        reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        [
          { header: 'Metric', key: 'metric' },
          { header: 'Value', key: 'value' },
        ],
        summary.kpis.map((k) => ({ metric: k.label, value: k.value.toFixed(2) })),
      );
    }
  };

  const reportCards = data?.reports ?? [];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate, download, and manage department reports in PDF, Excel, and CSV formats."
        loading={isPending}
        breadcrumbs={[{ label: 'System', href: '/reports' }, { label: 'Reports' }]}
      />

      {isError && !data ? (
        <ErrorState title="Unable to load reports" description="The reports service could not be reached." onRetry={() => queryClient.invalidateQueries({ queryKey: ['reports'] })} />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-foreground">Report Catalog</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reportCards.map((report) => {
                const Icon = reportIcons[report.id] ?? FileBarChart;
                const gen = generating[report.id];
                return (
                  <Card key={report.id} className="flex flex-col transition-shadow hover:shadow-card-hover">
                    <CardContent className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                          <Icon className="h-5 w-5" />
                        </span>
                        {report.suggested && <Badge tone="emerald">Popular</Badge>}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{report.name}</h3>
                      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{report.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge tone="neutral">{report.category}</Badge>
                        <span>· {report.size}</span>
                      </div>

                      {gen ? (
                        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
                            Generating {gen.format}…
                          </div>
                          <Progress value={(gen.step / progressSteps.length) * 100} tone="brand" />
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {progressSteps[Math.min(gen.step, progressSteps.length - 1)]}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {report.formats.map((fmt) => (
                            <Button
                              key={fmt}
                              variant="outline"
                              size="sm"
                              onClick={() => runGeneration(report, fmt)}
                              leftIcon={<Download className="h-3.5 w-3.5" />}
                            >
                              {fmt}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-foreground">Generation History</h2>
              </div>
              {allHistory.length > 0 && (
                <Badge tone="neutral">{allHistory.length} reports</Badge>
              )}
            </div>

            {allHistory.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    title="No reports generated yet"
                    description="Generated reports will appear here with their status and download options."
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3">Report</th>
                        <th className="px-5 py-3">Format</th>
                        <th className="px-5 py-3">Generated By</th>
                        <th className="px-5 py-3">Generated At</th>
                        <th className="px-5 py-3">Size</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allHistory.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                          <td className="px-5 py-3 text-[13px] font-medium text-foreground">{item.reportName}</td>
                          <td className="px-5 py-3">
                            <Badge tone={item.format === 'PDF' ? 'rose' : item.format === 'Excel' ? 'emerald' : 'blue'}>{item.format}</Badge>
                          </td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground">{item.generatedBy}</td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground" title={formatDateTime(item.generatedAt)}>
                            {timeAgo(item.generatedAt)}
                          </td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground">{item.size}</td>
                          <td className="px-5 py-3">
                            <Badge tone={item.status === 'Ready' ? 'emerald' : item.status === 'Generating' ? 'amber' : 'rose'} dot>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Dropdown
                              align="end"
                              width="sm"
                              trigger={
                                <Button variant="ghost" size="icon-sm" aria-label="Report actions">
                                  <Download className="h-4 w-4" />
                                </Button>
                              }
                              items={[
                                {
                                  key: 'download',
                                  label: 'Download again',
                                  icon: <Download className="h-3.5 w-3.5" />,
                                  onSelect: () => toast(`Downloading ${item.reportName}`, { tone: 'info', description: `${item.format} · ${item.size}` }),
                                },
                                {
                                  key: 'share',
                                  label: 'Share report',
                                  icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
                                  onSelect: () => toast('Share link copied', { tone: 'success', description: 'A secure share link has been copied to your clipboard.' }),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
