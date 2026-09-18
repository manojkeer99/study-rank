import { useMemo, useState } from "react";
import {
  Gauge,
  Clock3,
  Target,
  Award,
  Activity,
  Brain,
  ListChecks,
  Repeat,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarRange,
} from "lucide-react";
import type { AppData } from "../lib/types";
import {
  dailyMetrics,
  halfDelta,
  periodDelta,
  totalOf,
  consistency,
  bestDay,
  weekdayRhythm,
  getInsights,
  METRIC_META,
  type Metric,
  type InsightTone,
} from "../lib/activity";
import { dayLabel } from "../lib/date";
import { AreaChart, Sparkline, DeltaBadge } from "./charts";
import { StatCard } from "./ui";
import { cn } from "../utils/cn";

const METRICS: Array<{ id: Metric; icon: typeof Activity }> = [
  { id: "score", icon: Gauge },
  { id: "focus", icon: Brain },
  { id: "tasks", icon: ListChecks },
  { id: "habits", icon: Repeat },
];

const PERIODS = [7, 14, 30];

const TONE_STYLES: Record<InsightTone, { ring: string; icon: string; Icon: typeof TrendingUp }> = {
  up: {
    ring: "ring-emerald-500/25 bg-emerald-500/[0.07]",
    icon: "text-emerald-400 bg-emerald-500/15",
    Icon: TrendingUp,
  },
  down: {
    ring: "ring-rose-500/25 bg-rose-500/[0.07]",
    icon: "text-rose-400 bg-rose-500/15",
    Icon: TrendingDown,
  },
  flat: {
    ring: "ring-zinc-500/25 bg-zinc-500/[0.07]",
    icon: "text-zinc-400 bg-zinc-500/15",
    Icon: Minus,
  },
  tip: {
    ring: "ring-sky-500/25 bg-sky-500/[0.07]",
    icon: "text-sky-400 bg-sky-500/15",
    Icon: Lightbulb,
  },
};

export function PerformanceView({ data }: { data: AppData }) {
  const [metric, setMetric] = useState<Metric>("score");
  const [period, setPeriod] = useState(14);

  const all = useMemo(() => dailyMetrics(data, 30), [data]);
  const win = useMemo(() => all.slice(-period), [all, period]);
  const insights = useMemo(() => getInsights(all), [all]);

  const meta = METRIC_META[metric];
  const chartValues = win.map((m) => m[metric]);
  const chartLabels = win.map((m) =>
    period === 7 ? dayLabel(m.date).slice(0, 3) : `${m.date.getMonth() + 1}/${m.date.getDate()}`
  );
  const chartTips = win.map((m) =>
    m.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  );

  const delta = halfDelta(win, metric);
  const total = totalOf(win, metric);
  const average = total / win.length;
  const peak = Math.max(...chartValues);

  // KPI values
  const last14 = all.slice(-14);
  const score7 = periodDelta(all, "score", 7);
  const focus7 = periodDelta(all, "focus", 7);
  const focusHours7 = totalOf(all.slice(-7), "focus") / 60;
  const cons = consistency(last14, 50);
  const best = bestDay(last14);

  // growth rows (last 14 days vs previous)
  const growthRows = (["score", "focus", "tasks", "habits"] as Metric[]).map((m) => {
    const d = periodDelta(all, m, 7);
    return {
      metric: m,
      delta: d,
      spark: all.slice(-14).map((x) => x[m]),
    };
  });

  const rhythm = weekdayRhythm(all.slice(-28));
  const rhythmMax = Math.max(...rhythm.map((r) => r.avgScore), 1);
  const peakWeekday = [...rhythm].sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Performance</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Your daily activity combines focus minutes, completed tasks, and habit check-ins. Spot growth,
          catch slumps early, and protect your streaks.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          delay={0}
          icon={<Gauge className="h-5 w-5" />}
          label="Avg score · 14 days"
          value={`${Math.round(last14.reduce((a, m) => a + m.score, 0) / last14.length)} pts`}
          sub={<DeltaBadge pct={score7.pct} className="mt-2" />}
          accentClass="text-emerald-400 bg-emerald-500/10"
        />
        <StatCard
          delay={60}
          icon={<Clock3 className="h-5 w-5" />}
          label="Focus · last 7 days"
          value={`${focusHours7.toFixed(1)}h`}
          sub={<DeltaBadge pct={focus7.pct} className="mt-2" />}
          accentClass="text-sky-400 bg-sky-500/10"
        />
        <StatCard
          delay={120}
          icon={<Target className="h-5 w-5" />}
          label="Consistency · 14 days"
          value={`${cons.toFixed(0)}%`}
          sub={<span className="text-zinc-400">Days above 50 pts</span>}
          accentClass="text-violet-400 bg-violet-500/10"
        />
        <StatCard
          delay={180}
          icon={<Award className="h-5 w-5" />}
          label="Best day · 14 days"
          value={best ? `${best.score} pts` : "—"}
          sub={
            <span className="text-zinc-400">
              {best
                ? best.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                : ""}
            </span>
          }
          accentClass="text-amber-400 bg-amber-500/10"
        />
      </div>

      {/* Main graph + insights */}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card animate-fade-up p-6 xl:col-span-2" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Activity className="h-5 w-5 text-emerald-400" /> Daily activity trend
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Growth and downfall, day by day · {metric === "score" ? "composite score" : meta.label.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-black/30 p-0.5 ring-1 ring-white/[0.08]">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                      period === p ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {p}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric tabs */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {METRICS.map(({ id, icon: Icon }) => {
              const m = METRIC_META[id];
              const activeTab = metric === id;
              return (
                <button
                  key={id}
                  onClick={() => setMetric(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ring-1",
                    activeTab
                      ? "bg-white/10 text-white ring-white/15"
                      : "bg-transparent text-zinc-500 ring-white/[0.07] hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: activeTab ? m.color : undefined }} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Current window summary */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <span className="font-display text-4xl font-bold tracking-tight" style={{ color: meta.color }}>
                {metric === "focus"
                  ? `${Math.round(average)}m`
                  : metric === "score"
                    ? `${Math.round(average)}`
                    : `${average.toFixed(1)}`}
              </span>
              <span className="pb-1.5 text-xs font-medium text-zinc-500">
                avg / day · peak {meta.format(peak)}
                {metric === "focus" || metric === "tasks" || metric === "habits"
                  ? ` · ${meta.format(total)} total`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <DeltaBadge pct={delta.pct} />
              <span className="text-[11px] text-zinc-500">vs previous {Math.floor(win.length / 2)} days</span>
            </div>
          </div>

          <div className="mt-3">
            <AreaChart
              data={chartValues}
              labels={chartLabels}
              tips={chartTips}
              color={meta.color}
              max={metric === "score" ? 100 : undefined}
              height={250}
              formatY={meta.format}
              formatTip={(v) => `${meta.format(v)} ${meta.unit}`.trim()}
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
            <CalendarRange className="h-3.5 w-3.5" />
            Hover or tap the graph to inspect each day.
          </p>
        </section>

        {/* Insights */}
        <section className="card animate-fade-up flex flex-col p-6" style={{ animationDelay: "180ms" }}>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Lightbulb className="h-5 w-5 text-amber-400" /> Performance insights
          </h2>
          <div className="mt-4 space-y-3">
            {insights.map((ins, i) => {
              const s = TONE_STYLES[ins.tone];
              return (
                <div key={i} className={cn("flex gap-3 rounded-xl p-3.5 ring-1", s.ring)}>
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", s.icon)}>
                    <s.Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{ins.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{ins.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Growth table + weekly rhythm */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card animate-fade-up p-6" style={{ animationDelay: "200ms" }}>
          <h2 className="font-display text-lg font-semibold">Growth & declines</h2>
          <p className="mt-0.5 text-xs text-zinc-500">This week vs last week, per metric</p>
          <div className="mt-5 space-y-4">
            {growthRows.map(({ metric: m, delta: d, spark }) => {
              const mm = METRIC_META[m];
              return (
                <div key={m} className="flex items-center gap-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${mm.color}1a`, color: mm.color }}
                  >
                    {m === "score" ? (
                      <Gauge className="h-4 w-4" />
                    ) : m === "focus" ? (
                      <Brain className="h-4 w-4" />
                    ) : m === "tasks" ? (
                      <ListChecks className="h-4 w-4" />
                    ) : (
                      <Repeat className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-200">{mm.label}</p>
                    <p className="text-[11px] text-zinc-500">
                      {mm.format(d.recent)} avg now · {mm.format(d.previous)} before
                    </p>
                  </div>
                  <Sparkline data={spark} color={mm.color} />
                  <div className="w-16 text-right">
                    <DeltaBadge pct={d.pct} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card animate-fade-up p-6" style={{ animationDelay: "240ms" }}>
          <h2 className="font-display text-lg font-semibold">Weekly rhythm</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Average score by weekday · last 28 days
            {peakWeekday && (
              <span className="ml-1.5 text-emerald-400">· {peakWeekday.label} peaks</span>
            )}
          </p>
          <div className="mt-5 space-y-2.5">
            {rhythm.map((r) => {
              const isPeak = r.label === peakWeekday?.label;
              const pct = (r.avgScore / rhythmMax) * 100;
              return (
                <div key={r.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-9 text-xs font-semibold",
                      isPeak ? "text-emerald-400" : "text-zinc-400"
                    )}
                  >
                    {r.label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isPeak
                          ? "linear-gradient(90deg,#34d399,#0d9488)"
                          : "rgba(255,255,255,0.22)",
                      }}
                    />
                  </div>
                  <span className={cn("w-10 text-right text-xs font-bold", isPeak ? "text-emerald-400" : "text-zinc-400")}>
                    {Math.round(r.avgScore)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-5 rounded-xl bg-white/[0.04] p-3.5 text-xs leading-relaxed text-zinc-400 ring-1 ring-white/[0.07]">
            <span className="font-semibold text-zinc-200">How to read this:</span> your activity score blends
            focus minutes (×0.7), completed tasks (×8), and habit check-ins (×5), capped at 100 per day. Chase
            consistency over intensity.
          </p>
        </section>
      </div>
    </div>
  );
}
