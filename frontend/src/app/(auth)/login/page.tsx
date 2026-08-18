'use client';

import { GraduationCap } from 'lucide-react';
import { LoginForm } from '@/components/forms/login-form';
import { APP_NAME, COLLEGE_NAME, DEPARTMENT } from '@/constants';

function CampusHero() {
  return (
    <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.35),transparent_55%)] bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.2),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative z-10 flex-1 px-12 py-12">
        <div className="mb-8 flex items-center gap-2 text-white/70">
          <GraduationCap className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-wide text-white">{COLLEGE_NAME}</span>
        </div>

        <svg viewBox="0 0 520 360" className="mx-auto w-full max-w-lg" fill="none" aria-hidden>
          <defs>
            <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="b2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <rect x="60" y="170" width="120" height="150" rx="6" fill="url(#b1)" opacity="0.9" />
          <rect x="200" y="110" width="150" height="210" rx="6" fill="url(#b2)" opacity="0.85" />
          <rect x="370" y="150" width="110" height="170" rx="6" fill="#818cf8" opacity="0.9" />
          <rect x="200" y="110" width="150" height="24" rx="3" fill="#c7d2fe" opacity="0.5" />
          <path d="M195 300 l60 40 h90 l-60 -40 z" fill="#312e81" />
          <circle cx="460" cy="80" r="34" fill="#fbbf24" opacity="0.9" />
          <circle cx="460" cy="80" r="46" stroke="#fbbf24" strokeOpacity="0.4" />
          <g opacity="0.5" stroke="#94a3b8" strokeWidth="1.5">
            <line x1="60" y1="360" x2="480" y2="360" />
            <line x1="60" y1="330" x2="480" y2="330" />
          </g>
          <g fill="#e0e7ff" opacity="0.9">
            <rect x="84" y="196" width="16" height="10" rx="2" />
            <rect x="108" y="196" width="16" height="10" rx="2" />
            <rect x="132" y="196" width="16" height="10" rx="2" />
            <rect x="84" y="220" width="16" height="10" rx="2" />
            <rect x="132" y="220" width="16" height="10" rx="2" />
          </g>
          <g fill="#e0f2fe" opacity="0.9">
            <rect x="224" y="140" width="18" height="12" rx="2" />
            <rect x="252" y="140" width="18" height="12" rx="2" />
            <rect x="280" y="140" width="18" height="12" rx="2" />
            <rect x="224" y="168" width="18" height="12" rx="2" />
            <rect x="280" y="168" width="18" height="12" rx="2" />
          </g>
        </svg>

        <div className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold leading-tight text-white">Admission intelligence for the {DEPARTMENT} department</h2>
          <p className="max-w-md text-sm leading-relaxed text-white/60">
            Monitor TNEA counselling progress, track conversions, and make data-driven admission decisions from a single
            command center.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3 px-12 pb-12">
        {[
          { label: 'Live applicants', value: '1.4K+', accent: 'from-brand-500/40' },
          { label: 'Seats utilized', value: '68%', accent: 'from-sky-500/40' },
          { label: 'Role-based access', value: 'AHOD · HOD', accent: 'from-emerald-500/40' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-white/10 bg-gradient-to-br ${s.accent} to-white/5 p-4 backdrop-blur-sm`}>
            <p className="text-lg font-semibold text-white">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-white/60">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <CampusHero />
      <div className="flex flex-col items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold tracking-tight text-foreground">AIDDS</p>
                <p className="text-xs text-muted-foreground">{APP_NAME}</p>
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to access the admission analytics workspace.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
