'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Lock, LogIn, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/api';
import { useLogin } from '@/hooks/queries';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import type { AuthSession } from '@/types';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = (values: FormValues) => {
    loginMutation.mutate(
      { email: values.email, password: values.password, remember: values.remember },
      {
        onSuccess: (session: AuthSession & { remember?: boolean }) => {
          login({ user: session.user, token: session.token, expiresAt: session.expiresAt });
          toast(`Welcome back, ${session.user.name.split(' ')[0]}`, {
            tone: 'success',
            description: 'You have signed in successfully.',
          });
          router.replace(session.user.role === 'HOD' ? '/hod' : '/overview');
        },
        onError: (error: Error) => {
          const msg = error instanceof ApiError ? error.message : 'Unable to sign in. Please try again.';
          toast('Sign in failed', { tone: 'error', description: msg });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="ahod@cit.edu"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            icon={<Lock className="h-4 w-4" />}
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="rounded p-0.5 transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" {...register('remember')} />
        <button
          type="button"
          className="text-[13px] font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loginMutation.isPending} leftIcon={!loginMutation.isPending ? <LogIn className="h-4 w-4" /> : undefined}>
        {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
      </Button>

      <div className="rounded-lg border border-dashed border-border bg-muted/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Demo credentials</p>
        <div className="mt-1.5 grid gap-1 text-xs text-muted-foreground">
          <p><span className="font-medium text-foreground">Admin</span> · admin@cse.edu / ChangeMe!123</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <GraduationCap className="h-4 w-4 text-brand-600" />
        <p className="text-xs text-muted-foreground">
          Authorized access only · CIT CSE Department
        </p>
      </div>
    </form>
  );
}
