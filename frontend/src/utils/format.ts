export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 100000) {
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatNumber(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCutoff(value: number): string {
  return value.toFixed(2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
