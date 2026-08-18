import type { ReactNode } from 'react';
import { Skeleton } from './skeleton';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  loading?: boolean;
}

export function PageHeader({ title, description, actions, breadcrumbs, loading }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-7 w-72" />
        </div>
      ) : (
        <>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-3 text-xs text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                {breadcrumbs.map((item, i) => (
                  <li key={item.label} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden className="text-muted-foreground/50">/</span>}
                    {item.href ? (
                      <a href={item.href} className="transition-colors hover:text-foreground">
                        {item.label}
                      </a>
                    ) : (
                      <span aria-current="page" className="font-medium text-foreground">
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
              {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </>
      )}
    </div>
  );
}
