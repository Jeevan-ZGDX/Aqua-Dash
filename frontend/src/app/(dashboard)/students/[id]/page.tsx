'use client';

import {
  Award,
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  Fingerprint,
  GraduationCap,
  Home,
  IdCard,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState, EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { QuotaBadge, RoleBadge, RoundBadge, StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COMMUNITY_LABELS } from '@/constants';
import { useStudent } from '@/hooks/queries';
import { formatDate, formatDateTime, timeAgo } from '@/utils/date';
import { formatCutoff } from '@/utils/format';
import { toast } from '@/store/toast-store';
import { cn } from '@/utils/cn';

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [previewDoc, setPreviewDoc] = useState<{ name: string; category: string; size: string } | null>(null);
  const [activeTab, setActiveTab] = useState('academic');

  const { data: student, isPending, isError, refetch } = useStudent(id);

  const profileCompletion = useMemo(() => {
    if (!student) return 0;
    const fields = [
      student.name,
      student.dob,
      student.phone,
      student.email,
      student.address,
      student.fatherName,
      student.motherName,
      student.schoolName,
      student.preferredDepartments.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [student]);

  if (isPending && !student) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[420px] rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <ErrorState
        title="Student not found"
        description="The requested student profile could not be loaded. It may have been removed."
        onRetry={refetch}
      />
    );
  }

  const tabs = [
    { value: 'academic', label: 'Academic Details', icon: BookOpen },
    { value: 'personal', label: 'Personal Information', icon: User },
    { value: 'admission', label: 'Admission Information', icon: IdCard },
    { value: 'documents', label: 'Uploaded Documents', icon: FileText },
    { value: 'verification', label: 'Verification History', icon: ShieldCheck },
  ];

  return (
    <div>
      <PageHeader
        title="Student Profile"
        description={`${student.name} · ${student.academicYear}`}
        breadcrumbs={[{ label: 'Management', href: '/students' }, { label: 'Student Search', href: '/students' }, { label: student.name }]}
        actions={
          <Button variant="outline" onClick={() => router.push('/students')}>
            Back to search
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col items-center text-center">
                <Avatar name={student.name} size="xl" className="h-20 w-20 text-xl" />
                <h2 className="mt-3 text-base font-semibold text-foreground">{student.name}</h2>
                <p className="text-xs text-muted-foreground">{student.preferredDepartments[0]} · {student.academicYear}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <StatusBadge status={student.status} />
                  <QuotaBadge quota={student.quota} />
                </div>
                {student.allottedRound && (
                  <div className="mt-2">
                    <RoundBadge round={student.allottedRound} />
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Application No</span>
                  <span className="font-mono text-xs font-medium text-foreground">{student.applicationNo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Register No</span>
                  <span className="font-mono text-xs font-medium text-foreground">{student.registerNo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Community</span>
                  <span className="font-medium text-foreground">{student.community}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cutoff</span>
                  <span className="font-semibold tabular-nums text-foreground">{formatCutoff(student.cutoff)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Counselling Code</span>
                  <span className="font-mono text-xs font-medium text-foreground">{student.counsellingCode}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Data completeness for this application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Progress value={profileCompletion} tone={profileCompletion >= 80 ? 'emerald' : profileCompletion >= 50 ? 'brand' : 'amber'} className="flex-1" showLabel />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admission Timeline</CardTitle>
              <CardDescription>Application lifecycle progression</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {student.timeline.map((step) => (
                  <li key={step.label} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[26px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-card',
                        step.status === 'completed' && 'bg-emerald-500',
                        step.status === 'active' && 'bg-brand-500',
                        step.status === 'pending' && 'bg-muted',
                      )}
                    />
                    <p className={cn('text-[13px] font-medium', step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(step.date)} · {step.description}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto scrollbar-none">
                  <TabsList className="mb-2 w-max">
                    {tabs.map((t) => (
                      <TabsTrigger key={t.value} value={t.value} icon={<t.icon className="h-3.5 w-3.5" />} className="whitespace-nowrap">
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="academic" className="mt-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoRow icon={GraduationCap} label="School Name" value={student.schoolName} />
                    <InfoRow icon={Award} label="School Type" value={student.schoolType} />
                    <InfoRow icon={BookOpen} label="12th Percentage" value={`${student.percentage}%`} />
                    <InfoRow icon={Award} label="Cutoff Score" value={formatCutoff(student.cutoff)} />
                    <InfoRow icon={Home} label="Preferred Departments" value={student.preferredDepartments.join(', ')} />
                    <InfoRow icon={Fingerprint} label="Average Dept. Cutoff" value={formatCutoff(student.avgCutoff)} />
                  </div>
                  <div className="mt-5 rounded-lg bg-muted/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department Preferences</p>
                    <div className="mt-2 space-y-2">
                      {student.preferences.map((p) => (
                        <div key={p.rank} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 shadow-card">
                          <span className="flex items-center gap-2 text-sm text-foreground">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                              {p.rank}
                            </span>
                            {p.department}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="mt-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoRow icon={CalendarDays} label="Date of Birth" value={formatDate(student.dob, 'dd MMM yyyy')} />
                    <InfoRow icon={User} label="Gender" value={student.gender} />
                    <InfoRow icon={Fingerprint} label="Blood Group" value={student.bloodGroup} />
                    <InfoRow icon={User} label="Father's Name" value={student.fatherName} />
                    <InfoRow icon={User} label="Mother's Name" value={student.motherName} />
                    <InfoRow icon={Phone} label="Phone" value={student.phone} />
                    <InfoRow icon={Mail} label="Email" value={student.email} />
                    <InfoRow icon={MapPin} label="Address" value={student.address} />
                  </div>
                </TabsContent>

                <TabsContent value="admission" className="mt-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoRow icon={IdCard} label="Application Number" value={student.applicationNo} />
                    <InfoRow icon={Fingerprint} label="Register Number" value={student.registerNo} />
                    <InfoRow icon={ScrollText} label="Academic Year" value={student.academicYear} />
                    <InfoRow icon={Award} label="Community" value={`${student.community} · ${COMMUNITY_LABELS[student.community] ?? ''}`} />
                    <InfoRow icon={ShieldCheck} label="Quota" value={student.quota} />
                    <InfoRow icon={CalendarDays} label="Applied On" value={formatDateTime(student.appliedAt)} />
                    {student.admittedAt && (
                      <InfoRow icon={CalendarDays} label="Admitted On" value={formatDateTime(student.admittedAt)} />
                    )}
                  </div>
                  <div className="mt-5 rounded-lg bg-muted/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">District</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{student.district}</p>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-3">
                  {student.documents.length === 0 ? (
                    <EmptyState title="No documents uploaded" description="This applicant has not uploaded any supporting documents yet." />
                  ) : (
                    <div className="space-y-2">
                      {student.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-colors hover:bg-muted/40">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-foreground">{doc.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {doc.size} · Uploaded {timeAgo(doc.uploadedAt)}
                            </p>
                          </div>
                          <Badge tone={doc.status === 'Verified' ? 'emerald' : doc.status === 'Pending' ? 'amber' : 'rose'} dot>
                            {doc.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Download ${doc.name}`}
                            onClick={() => {
                              toast(`Downloading ${doc.name}`, { tone: 'info', description: `${doc.size} · prepared for download.` });
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            Preview
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="verification" className="mt-3">
                  {student.verificationHistory.length === 0 ? (
                    <EmptyState title="No verification activity" description="Verification history will appear once the application is reviewed." />
                  ) : (
                    <ol className="relative space-y-5 border-l border-border pl-6">
                      {student.verificationHistory.map((entry) => (
                        <li key={entry.id} className="relative">
                          <span
                            className={cn(
                              'absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-card',
                              entry.outcome === 'Approved' && 'bg-emerald-500',
                              entry.outcome === 'Flagged' && 'bg-rose-500',
                              entry.outcome === 'Submitted' && 'bg-brand-500',
                              entry.outcome === 'Comment' && 'bg-amber-500',
                            )}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-medium text-foreground">{entry.action}</p>
                            <Badge tone={entry.outcome === 'Approved' ? 'emerald' : entry.outcome === 'Flagged' ? 'rose' : entry.outcome === 'Comment' ? 'amber' : 'blue'}>
                              {entry.outcome}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {entry.actor} · <RoleBadge role={entry.role} /> · {formatDateTime(entry.timestamp)}
                          </p>
                          {entry.note && <p className="mt-1 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{entry.note}</p>}
                        </li>
                      ))}
                    </ol>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name ?? ''}
        description={`${previewDoc?.category} · ${previewDoc?.size}`}
        size="sm"
      >
        <div className="flex flex-col items-center py-4 text-center">
          <div className="flex h-28 w-24 items-center justify-center rounded-lg border border-border bg-muted">
            <FileText className="h-10 w-10 text-rose-500" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Document preview is generated on demand.</p>
          <p className="text-xs text-muted-foreground">Files are rendered in the secured preview viewer.</p>
        </div>
      </Dialog>
    </div>
  );
}
