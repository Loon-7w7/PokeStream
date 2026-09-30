"use client";
// Gráficas de /admin con Recharts. Los datos llegan ya agregados del servidor (domain/charts.ts).
// Colores validados con el validador de paletas sobre el fondo del panel (#101b2e): banda de
// luminosidad, separación para daltonismo y contraste. El texto nunca lleva el color de la serie.
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type YAxisTickContentProps,
} from "recharts";
import { Sprite } from "@/core/ui/Sprite";
import type { AdminCharts as Charts } from "../types";

const SERIES = { primary: "#2a9ad6", nuzlocke: "#d9752b" };
const INK = { text: "#e8edf6", muted: "#8595ae", grid: "#2a3a55", surface: "#101b2e" }; // tokens del tema
const BAR = 22; // grosor máximo de barra (px)
const TICK = { fill: INK.muted, fontSize: 12 };

export function AdminCharts({ charts, spritesBase }: { charts: Charts; spritesBase: string }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Card title="Embudo de la beta" subtitle="De quien tiene acceso a quien está en directo ahora. Sin bloqueados.">
        <Funnel data={charts.funnel} />
      </Card>
      <Card title="Registros por semana" subtitle="Cuentas nuevas en las últimas 12 semanas.">
        <Weekly data={charts.weekly} />
      </Card>
      <Card title="Pokémon más usados" subtitle="En los equipos actuales de todos los usuarios.">
        <TopSpecies data={charts.topSpecies} spritesBase={spritesBase} />
      </Card>
      <Card title="Nuzlocke frente a normal" subtitle="Partidas actuales por modo y muertes en las Nuzlocke.">
        <Modes data={charts.modes} />
      </Card>
    </section>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-xs text-muted">{subtitle}</p>
      {children}
    </div>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="grid h-48 place-items-center text-center text-sm text-muted">{children}</p>;

type TipRow = { name: string; value: React.ReactNode; color: string };

/** Tooltip con el estilo del panel: valor en texto normal, color solo en la muestra. */
function Tip({ active, label, rows }: { active?: boolean; label?: React.ReactNode; rows: TipRow[] }) {
  if (!active || !rows.length) return null;
  return (
    <div className="rounded-lg border border-line bg-bg/95 px-3 py-2 text-xs text-text shadow-xl">
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: r.color }} />
          <span className="text-muted">{r.name}</span>
          <span className="ml-auto pl-3 font-mono">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Contenido de tooltip a partir del dato bajo el cursor (una fila de `data`). */
function tipFor<T>(render: (d: T) => { label?: React.ReactNode; rows: TipRow[] }) {
  return function TipContent({ active, payload }: TooltipContentProps) {
    const d = payload?.[0]?.payload as T | undefined;
    return d ? <Tip active={active} {...render(d)} /> : null;
  };
}

function Funnel({ data }: { data: Charts["funnel"] }) {
  const top = data[0]?.value ?? 0;
  if (!top) return <Empty>Aún no hay usuarios.</Empty>;
  const rows = data.map((d) => ({ ...d, pct: Math.round((d.value / top) * 100) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }}>
        <XAxis type="number" hide domain={[0, top]} />
        <YAxis type="category" dataKey="label" width={150} tick={TICK} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: INK.grid, opacity: 0.35 }}
          content={tipFor((d: (typeof rows)[number]) => ({
            label: d.label,
            rows: [{ name: "Usuarios", value: `${d.value} (${d.pct} %)`, color: SERIES.primary }],
          }))}
        />
        <Bar dataKey="value" fill={SERIES.primary} maxBarSize={BAR} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="value" position="right" fill={INK.text} fontSize={12} formatter={(v) => `${v}`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" });

function Weekly({ data }: { data: Charts["weekly"] }) {
  const total = data.reduce((n, w) => n + w.count, 0);
  if (!total) return <Empty>Sin registros en las últimas 12 semanas.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid vertical={false} stroke={INK.grid} />
        <XAxis
          dataKey="week"
          tickFormatter={shortDate}
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: INK.grid }}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis allowDecimals={false} tick={TICK} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: INK.grid, opacity: 0.35 }}
          content={tipFor((d: Charts["weekly"][number]) => ({
            label: `Semana del ${shortDate(d.week)}`,
            rows: [{ name: "Registros", value: d.count, color: SERIES.primary }],
          }))}
        />
        <Bar dataKey="count" fill={SERIES.primary} maxBarSize={BAR} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TopSpecies({ data, spritesBase }: { data: Charts["topSpecies"]; spritesBase: string }) {
  if (!data.length) return <Empty>Todavía nadie tiene Pokémon en su equipo.</Empty>;
  const byName = new Map(data.map((d) => [d.name, d]));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tickLine={false}
          axisLine={false}
          // Sprite + nombre: HTML dentro del SVG para reutilizar <Sprite> (con sus respaldos)
          tick={({ x, y, payload }: YAxisTickContentProps) => {
            const d = byName.get(String(payload.value));
            return (
              <foreignObject x={Number(x) - 150} y={Number(y) - 14} width={146} height={28}>
                <div className="flex h-7 items-center justify-end gap-1.5 text-xs text-muted">
                  <span className="truncate">{payload.value}</span>
                  {d && <Sprite base={spritesBase} spriteId={d.spriteId} alt="" className="size-7 shrink-0 object-contain" />}
                </div>
              </foreignObject>
            );
          }}
        />
        <Tooltip
          cursor={{ fill: INK.grid, opacity: 0.35 }}
          content={tipFor((d: Charts["topSpecies"][number]) => ({
            label: d.name,
            rows: [{ name: "Equipos con él", value: d.count, color: SERIES.primary }],
          }))}
        />
        <Bar dataKey="count" fill={SERIES.primary} maxBarSize={BAR} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" fill={INK.text} fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Modes({ data }: { data: Charts["modes"] }) {
  const total = data.nuzlocke + data.normal;
  if (!total) return <Empty>Aún no hay partidas.</Empty>;
  const pct = (n: number) => Math.round((n / total) * 100);
  const legend = [
    { name: "Nuzlocke", value: data.nuzlocke, color: SERIES.nuzlocke },
    { name: "Normal", value: data.normal, color: SERIES.primary },
  ];
  return (
    <div>
      <ResponsiveContainer width="100%" height={40}>
        <BarChart data={[{ ...data, key: "Partidas" }]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, total]} />
          <YAxis type="category" dataKey="key" hide />
          <Tooltip
            cursor={false}
            content={({ active }: { active?: boolean }) => (
              <Tip active={active} rows={legend.map((l) => ({ ...l, value: `${l.value} (${pct(l.value)} %)` }))} />
            )}
          />
          {/* 2 px del color del fondo separan los segmentos */}
          <Bar
            dataKey="nuzlocke"
            stackId="m"
            fill={SERIES.nuzlocke}
            maxBarSize={BAR}
            stroke={INK.surface}
            strokeWidth={2}
            radius={data.normal ? [4, 0, 0, 4] : 4}
            isAnimationActive={false}
          />
          <Bar
            dataKey="normal"
            stackId="m"
            fill={SERIES.primary}
            maxBarSize={BAR}
            stroke={INK.surface}
            strokeWidth={2}
            radius={data.nuzlocke ? [0, 4, 4, 0] : 4}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {legend.map((l) => (
          <li key={l.name} className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: l.color }} />
            <span className="text-muted">{l.name}</span>
            <span className="font-mono">
              {l.value} · {pct(l.value)} %
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-bg/40 p-3">
          <div className="text-xs text-muted">Media de muertes por Nuzlocke</div>
          <div className="mt-1 text-2xl font-semibold">{data.avgDeaths ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-line bg-bg/40 p-3">
          <div className="text-xs text-muted">Máximo en una partida</div>
          <div className="mt-1 text-2xl font-semibold">{data.nuzlocke ? data.maxDeaths : "—"}</div>
        </div>
      </div>
    </div>
  );
}
