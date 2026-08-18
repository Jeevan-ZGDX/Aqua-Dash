'use client';

import { Bell, ChevronDown, LogOut, Moon, RefreshCw, Settings, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Tooltip } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { cn } from '@/utils/cn';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </Tooltip>
  );
}

function RefreshButton() {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    queryClient.invalidateQueries().then(() => {
      setTimeout(() => {
        setSpinning(false);
        toast('Data refreshed', { tone: 'success', description: 'All dashboards have been synchronized.' });
      }, 500);
    });
  };

  return (
    <Tooltip content="Refresh data">
      <Button variant="ghost" size="icon-sm" aria-label="Refresh data" onClick={refresh}>
        <RefreshCw className={cn('h-4 w-4', spinning && 'animate-spin')} />
      </Button>
    </Tooltip>
  );
}

const notifications = [
  { id: 1, title: 'Verification pending', description: '12 applications awaiting document verification', tone: 'text-amber-500', time: '12m ago' },
  { id: 2, title: 'Round 4 underway', description: 'Counselling Round 4 allotments are being processed', tone: 'text-brand-500', time: '1h ago' },
  { id: 3, title: 'Report exported', description: 'Admission Summary PDF was generated successfully', tone: 'text-emerald-500', time: '3h ago' },
];

function NotificationsMenu() {
  const [unread, setUnread] = useState(notifications.length);
  return (
    <Dropdown
      align="end"
      width="md"
      trigger={
        <div className="relative">
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-card">
              {unread}
            </span>
          )}
        </div>
      }
    >
      <div className="p-1">
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <p className="text-xs font-semibold text-foreground">Notifications</p>
          <button
            onClick={() => setUnread(0)}
            className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => setUnread((u) => Math.max(0, u - 1))}
              className="flex w-full gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', n.tone)} />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">{n.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{n.description}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground/70">{n.time}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Dropdown>
  );
}

function UserMenu() {
  const { session, logout } = useAuthStore();
  const router = useRouter();
  const user = session?.user;
  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Dropdown
      align="end"
      width="md"
      trigger={
        <button className="flex items-center gap-2 rounded-lg border border-transparent p-1 transition-colors hover:border-border hover:bg-muted">
          <Avatar name={user.name} initials={user.initials} color={user.avatarColor} size="md" />
          <span className="hidden text-left sm:block">
            <span className="block text-[13px] font-medium leading-tight text-foreground">{user.name}</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">{user.role}</span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </button>
      }
      items={[
        {
          key: 'profile',
          label: 'View profile',
          icon: <User className="h-3.5 w-3.5" />,
          onSelect: () => router.push('/settings'),
        },
        {
          key: 'settings',
          label: 'Account settings',
          icon: <Settings className="h-3.5 w-3.5" />,
          onSelect: () => router.push('/settings'),
        },
        { key: 'sep', label: '', separator: true },
        {
          key: 'logout',
          label: 'Sign out',
          icon: <LogOut className="h-3.5 w-3.5" />,
          danger: true,
          onSelect: handleLogout,
        },
      ]}
    />
  );
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden items-center gap-2 text-[13px] text-muted-foreground sm:flex">
        <span className="font-medium text-foreground">CSE Department</span>
        <span className="text-muted-foreground/50">/</span>
        <span>TNEA Counselling {new Date().getFullYear()}</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <RefreshButton />
        <ThemeToggle />
        <NotificationsMenu />
        <div className="mx-1 h-5 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
