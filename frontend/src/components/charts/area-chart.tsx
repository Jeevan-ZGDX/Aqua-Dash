'use client';

import { Area, AreaChart as ReAreaChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/utils/format';

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

function GenericTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-lg border border-border bg-popover p-3 shadow-dropdown">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color ?? p.fill }} />
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

export interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  stacked?: boolean;
  valueFormatter?: (value: number) => string;
  showGrid?: boolean;
  minTickGap?: number;
  brush?: boolean;
}

export function AreaChart({
  data,
  xKey,
  series,
  height = 280,
  stacked,
  valueFormatter,
  showGrid = true,
  minTickGap = 28,
  brush,
}: AreaChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" className="stroke-border/50" />}
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={minTickGap} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} />
          <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => formatNumber(v)} />
          <Tooltip content={<GenericTooltip valueFormatter={valueFormatter} />} cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              stackId={stacked ? 'stack' : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-card)' }}
            />
          ))}
          {brush && (
            <Brush dataKey={xKey} height={28} stroke="#6366f1" travellerWidth={10} className="fill-card" />
          )}
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
