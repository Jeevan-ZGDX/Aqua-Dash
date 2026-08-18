'use client';

import { Cell, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/utils/format';

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

function PieTooltip({ active, payload, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const total = payload.reduce((s: number, x: any) => s + (x.value ?? 0), 0);
  const pct = total ? ((p.value ?? 0) / total) * 100 : 0;
  return (
    <div className="min-w-[150px] rounded-lg border border-border bg-popover p-3 shadow-dropdown">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.payload?.color ?? p.payload?.fill }} />
        {p.name}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {valueFormatter ? valueFormatter(p.value) : formatNumber(p.value)}
      </p>
      <p className="text-[11px] text-muted-foreground">{pct.toFixed(1)}% of total</p>
    </div>
  );
}

export interface DonutChartProps {
  data: PieDatum[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
  centerSub?: string;
  valueFormatter?: (value: number) => string;
  onClickSlice?: (datum: PieDatum) => void;
  activeIndex?: number;
}

export function DonutChart({
  data,
  height = 260,
  innerRadius = 62,
  outerRadius = 86,
  centerLabel,
  centerValue,
  centerSub,
  valueFormatter,
  onClickSlice,
  activeIndex,
}: DonutChartProps) {
  const filtered = data.filter((d) => d.value > 0);

  return (
    <div style={{ height }} className="relative w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Tooltip content={<PieTooltip valueFormatter={valueFormatter} />} />
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="none"
            onClick={onClickSlice ? (entry: any) => onClickSlice({ name: entry.name, value: entry.value, color: entry.payload?.color ?? entry.payload?.fill }) : undefined}
            className={onClickSlice ? 'cursor-pointer outline-none' : undefined}
          >
            {filtered.map((d, i) => (
              <Cell
                key={d.name}
                fill={d.color}
                opacity={activeIndex === undefined || activeIndex === i ? 1 : 0.32}
                style={{ transition: 'opacity 200ms', outline: 'none' }}
              />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
      {(centerValue !== undefined || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{centerLabel}</span>}
          {centerValue !== undefined && <span className="text-xl font-semibold tabular-nums text-foreground">{centerValue}</span>}
          {centerSub && <span className="text-[11px] text-muted-foreground">{centerSub}</span>}
        </div>
      )}
    </div>
  );
}

export function PieChart({ data, height = 260, valueFormatter }: { data: PieDatum[]; height?: number; valueFormatter?: (value: number) => string }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Tooltip content={<PieTooltip valueFormatter={valueFormatter} />} />
          <Pie data={filtered} dataKey="value" nameKey="name" outerRadius={90} stroke="none" paddingAngle={1}>
            {filtered.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}
