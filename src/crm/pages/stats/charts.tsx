// Общий вид графиков: сдержанно, как в amo. Тонкие линии, серая сетка, PT Sans 12px.

import type { ReactNode } from 'react';

export const AXIS_TICK = { fontSize: 12, fill: '#92989b', fontFamily: 'PT Sans, Arial, sans-serif' } as const;
export const AXIS_TICK_DARK = { fontSize: 12, fill: 'rgba(225, 235, 248, 0.72)', fontFamily: 'PT Sans, Arial, sans-serif' } as const;
export const GRID_STROKE = '#eceeef';

interface Row {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  dataKey?: string | number | ((o: unknown) => unknown);
  payload?: Record<string, unknown>;
  fill?: string;
  stroke?: string;
}

/**
 * Подсказка в наших токенах. Передаётся в <Tooltip content={...} />:
 * recharts кладёт сверху active/payload/label.
 */
export function ChartTip({
  active,
  payload,
  label,
  format = (v) => String(v),
  labelFormat,
  dark,
  footer,
}: {
  active?: boolean;
  payload?: Row[];
  label?: string | number;
  format?: (v: number, row: Row) => string;
  labelFormat?: (l: string | number | undefined, rows: Row[]) => ReactNode;
  dark?: boolean;
  footer?: (rows: Row[]) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const head = labelFormat ? labelFormat(label, payload) : label;
  return (
    <div className={`stats-tip${dark ? ' stats-tip--dark' : ''}`}>
      {head !== undefined && head !== '' && <div className="stats-tip__head">{head}</div>}
      {payload.map((r, i) => (
        <div key={i} className="stats-tip__row">
          <span className="stats-tip__key" style={{ background: swatch(r) }} aria-hidden="true" />
          <span className="stats-tip__name">{r.name}</span>
          <span className="stats-tip__val">{format(Number(r.value ?? 0), r)}</span>
        </div>
      ))}
      {footer && <div className="stats-tip__foot">{footer(payload)}</div>}
    </div>
  );
}

const swatch = (r: Row) =>
  r.color ?? r.fill ?? (r.payload?.fill as string | undefined) ?? (r.payload?.color as string | undefined) ?? r.stroke;

/** Легенда над графиком: короткий штрих цвета + подпись текстом */
export function Legend({ items, dark }: { items: { label: string; color: string; line?: boolean }[]; dark?: boolean }) {
  return (
    <ul className={`stats-legend${dark ? ' stats-legend--dark' : ''}`}>
      {items.map((it) => (
        <li key={it.label}>
          <span
            className={`stats-legend__key${it.line ? ' stats-legend__key--line' : ''}`}
            style={{ background: it.color }}
            aria-hidden="true"
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** Сегментированный переключатель как в amo (ПО ДНЯМ / ПО НЕДЕЛЯМ…) */
export function Toggle<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="stats-toggle" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={o.id === value ? 'is-active' : undefined}
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
