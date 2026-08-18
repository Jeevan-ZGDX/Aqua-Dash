'use client';

import { STATUS_BADGE_TONES, STATUS_COLORS } from '@/constants';
import type { ApplicationStatus, Role } from '@/types';
import { cn } from '@/utils/cn';
import { Badge } from './badge';

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const meta = STATUS_BADGE_TONES[status] ?? STATUS_BADGE_TONES.Applied;
  return (
    <Badge tone={meta.tone as never} dot dotColor={meta.dot} className={className}>
      {status}
    </Badge>
  );
}

export function RoundBadge({ round }: { round: string }) {
  if (!round) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    'Round 1': 'text-brand-700 bg-brand-50 ring-brand-600/15 dark:text-brand-300 dark:bg-brand-950',
    'Round 2': 'text-sky-700 bg-sky-50 ring-sky-600/15 dark:text-sky-300 dark:bg-sky-950',
    'Round 3': 'text-violet-700 bg-violet-50 ring-violet-600/15 dark:text-violet-300 dark:bg-violet-950',
    'Round 4': 'text-amber-700 bg-amber-50 ring-amber-600/20 dark:text-amber-300 dark:bg-amber-950',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', colors[round])}>
      {round}
    </span>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return role === 'HOD' ? (
    <Badge tone="brand" className={className}>
      HOD
    </Badge>
  ) : (
    <Badge tone="indigo" className={className}>
      AHOD
    </Badge>
  );
}

export function QuotaBadge({ quota }: { quota: string }) {
  return quota === 'Management' ? (
    <Badge tone="amber">{quota}</Badge>
  ) : (
    <Badge tone="blue">{quota}</Badge>
  );
}

export function CutoffPill({ cutoff }: { cutoff: number }) {
  const color = STATUS_COLORS[cutoff >= 185 ? 'Joined' : cutoff >= 170 ? 'Confirmed' : cutoff >= 155 ? 'Counselling Registered' : 'Applied'];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {cutoff.toFixed(2)}
    </span>
  );
}
