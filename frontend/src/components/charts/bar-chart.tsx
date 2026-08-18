'use client';

import { Bar, BarChart as ReBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/utils/format';

function BarTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[140px] rounded-lg border border-border bg-popover p-3 shadow-dropdown">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill ?? p.color }} />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {valueFormatter ? valueFormatter(p.value) : formatNumber(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; name: string; color: string }[];
  height?: number;
  stacked?: boolean;
  radius?: [number, number, number, number];
  cellColors?: string[];
  valueFormatter?: (value: number) => string;
  horizontal?: boolean;
  barSize?: number;
  onClickBar?: (entry: Record<string, unknown>) => void;
}

export function BarChart({
  data,
  xKey,
  bars,
  height = 280,
  stacked,
  radius = [6, 6, 0, 0],
  cellColors,
  valueFormatter,
  horizontal,
  barSize,
  onClickBar,
}: BarChartProps) {
  const handleClick = (dataPoint: any) => {
    if (onClickBar && dataPoint?.payload) onClickBar(dataPoint.payload);
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          {horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => formatNumber(v)} />
              <YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} width={96} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} interval={horizontal ? 0 : 'preserveStartEnd'} minTickGap={12} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} />
              <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => formatNumber(v)} />
            </>
          )}
          <Tooltip content={<BarTooltip valueFormatter={valueFormatter} />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
          {bars.map((b, i) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              stackId={stacked ? 'stack' : undefined}
              fill={cellColors ? undefined : b.color}
              radius={stacked ? (i === bars.length - 1 ? radius : [0, 0, 0, 0]) : radius}
              maxBarSize={barSize ?? 36}
              onClick={onClickBar ? handleClick : undefined}
              className={onClickBar ? 'cursor-pointer' : undefined}
            >
              {cellColors &&
                data.map((_, idx) => (
                  <Cell key={idx} fill={cellColors[idx % cellColors.length]} cursor={onClickBar ? 'pointer' : undefined} />
                ))}
            </Bar>
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
