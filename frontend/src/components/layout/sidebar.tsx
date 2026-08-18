'use client';

import {
  Armchair,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PieChart,
  Search,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, SIDE_BAR_SECTIONS } from '@/constants';
import { cn } from '@/utils/cn';
import { useSession } from '@/store/auth-store';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  PieChart,
  Armchair,
  TrendingUp,
  Search,
  FileBarChart,
  ShieldCheck,
  FileSpreadsheet,
};

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const user = session?.user;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">AIDDS</p>
          <p className="truncate text-[11px] text-sidebar-muted">CSE Admissions Analytics</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 scrollbar-none" aria-label="Main navigation">
        {SIDE_BAR_SECTIONS.map((section) => {
          const items = visibleItems.filter((i) => i.section === section.key);
          if (items.length === 0) return null;
          return (
            <div key={section.key}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/70">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = iconMap[item.icon] ?? LayoutDashboard;
                  const active =
                    pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        active
                          ? 'bg-brand-600/90 text-white shadow-sm'
                          : 'text-sidebar-foreground/85 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-sidebar-muted group-hover:text-white/80')} />
                      {item.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-lg bg-white/[0.04] p-3">
          <p className="text-[11px] font-medium text-sidebar-foreground/90">{user?.name ?? 'Guest'}</p>
          <p className="mt-0.5 text-[11px] text-sidebar-muted">{user?.title ?? 'CSE Department'}</p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-sidebar-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {user?.role === 'HOD' ? 'HOD Access' : 'AHOD Access'} · CIT
          </div>
        </div>
      </div>
    </div>
  );
}
