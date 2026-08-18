import { cn } from '@/utils/cn';

export interface AvatarProps {
  name: string;
  initials?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ name, initials, color = '#6366f1', size = 'md', className }: AvatarProps) {
  const fallback = initials ?? name
    .replace(/^Dr\.\s+/, '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {fallback}
    </span>
  );
}
