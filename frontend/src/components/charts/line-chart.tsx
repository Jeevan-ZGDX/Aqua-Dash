'use client';

import { CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/utils/format';
import type { ChartSeries } from './area-chart';

function LineTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-lg border border-border bg-popover p-3 shadow-dropdown">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.stroke ?? p.color }} />
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

export interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  dots?: boolean;
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
}

export function LineChart({ data, xKey, series, height = 280, dots = false, valueFormatter, yAxisWidth = 44 }: LineChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={28} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} />
          <YAxis tickLine={false} axisLine={false} width={yAxisWidth} fontSize={11} tick={{ fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => formatNumber(v)} />
          <Tooltip content={<LineTooltip valueFormatter={valueFormatter} />} cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={dots ? { r: 2.5, fill: s.color, strokeWidth: 0 } : false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-card)' }}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
