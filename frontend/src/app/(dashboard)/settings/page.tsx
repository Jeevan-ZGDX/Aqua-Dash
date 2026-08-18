'use client';

import { Bell, Database, Info, Moon, Palette, Shield, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RoleBadge } from '@/components/ui/status-badge';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import { APP_NAME } from '@/constants';

export default function SettingsPage() {
  const session = useAuthStore((state) => state.session);
  const user = session?.user;
  const { setTheme, theme } = useTheme();
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    exportNotifications: true,
    verificationAlerts: true,
    weeklyDigest: false,
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, notifications, and workspace preferences."
        breadcrumbs={[{ label: 'System', href: '/settings' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name ?? 'User'} initials={user?.initials} color={user?.avatarColor} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  <div className="mt-1.5">
                    <RoleBadge role={user?.role ?? 'AHOD'} />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium text-foreground">{user?.department ?? 'Computer Science Engineering'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-foreground">{user?.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Workspace</span>
                  <span className="font-medium text-foreground">{APP_NAME}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the dashboard looks</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                label="Theme"
                value={theme ?? 'light'}
                onChange={(e) => setTheme(e.target.value)}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Moon className="h-3.5 w-3.5" /> Dark mode reduces glare during long counselling sessions.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifications
              </CardTitle>
              <CardDescription>Choose which activities trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Switch
                checked={prefs.emailAlerts}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailAlerts: v }))}
                label="Email alerts"
                description="Receive email notifications for new application batches"
                icon={<Bell className="h-4 w-4 text-muted-foreground" />}
              />
              <Switch
                checked={prefs.exportNotifications}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, exportNotifications: v }))}
                label="Export notifications"
                description="Get notified when generated reports are ready"
                icon={<Database className="h-4 w-4 text-muted-foreground" />}
              />
              <Switch
                checked={prefs.verificationAlerts}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, verificationAlerts: v }))}
                label="Verification alerts"
                description="Alerts for applications pending document verification"
                icon={<Shield className="h-4 w-4 text-muted-foreground" />}
              />
              <Switch
                checked={prefs.weeklyDigest}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, weeklyDigest: v }))}
                label="Weekly digest"
                description="A weekly summary of admission activity every Monday"
                icon={<Info className="h-4 w-4 text-muted-foreground" />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                Account & Data
              </CardTitle>
              <CardDescription>Session, security, and data management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Active session</p>
                  <p className="text-xs text-muted-foreground">
                    Signed in as {user?.email} · Expires in 12 hours
                  </p>
                </div>
                <Badge tone="emerald" dot>Active</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Download a copy of the current student dataset (Excel).</p>
                <Button
                  variant="outline"
                  onClick={() => toast('Data export started', { tone: 'info', description: 'Your dataset is being prepared for download.' })}
                >
                  Export dataset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
