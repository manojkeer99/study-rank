import type { AppData } from "./types";
import { dateKey, lastNDays, dayLabel } from "./date";

export type Metric = "score" | "focus" | "tasks" | "habits";

export interface DayMetric {
  key: string;
  date: Date;
  focus: number; // focus minutes
  tasks: number; // tasks completed that day
  habits: number; // habits checked that day
  score: number; // composite 0..100
}

export const METRIC_META: Record<
  Metric,
  { label: string; unit: string; color: string; max?: number; format: (n: number) => string }
> = {
  score: {
    label: "Activity score",
    unit: "pts",
    color: "#10b981",
    max: 100,
    format: (n) => `${Math.round(n)}`,
  },
  focus: {
    label: "Focus minutes",
    unit: "min",
    color: "#0ea5e9",
    format: (n) => `${Math.round(n)}m`,
  },
  tasks: {
    label: "Tasks completed",
    unit: "tasks",
    color: "#f59e0b",
    format: (n) => `${Math.round(n)}`,
  },
  habits: {
    label: "Habits checked",
    unit: "",
    color: "#8b5cf6",
    format: (n) => `${Math.round(n)}`,
  },
};

/** Composite daily performance: focus + completed tasks + habits. */
export function dailyMetrics(data: AppData, days: number): DayMetric[] {
  return lastNDays(days).map((date) => {
    const key = dateKey(date);
    const focus = data.sessions
      .filter((s) => s.date === key)
      .reduce((sum, s) => sum + s.minutes, 0);
    const tasks = data.tasks.filter((t) => t.completed && t.due === key).length;
    const habits = data.habits.filter((h) => h.completedDates.includes(key)).length;
    const score = Math.min(
      100,
      Math.round(focus * 0.7 + tasks * 8 + habits * 5)
    );
    return { key, date, focus, tasks, habits, score };
  });
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface Delta {
  recent: number;
  previous: number;
  pct: number; // positive = growth, negative = decline
  abs: number;
  tone: "up" | "down" | "flat";
}

function makeDelta(recent: number, previous: number): Delta {
  const pct = previous > 0 ? ((recent - previous) / previous) * 100 : recent > 0 ? 100 : 0;
  const tone: Delta["tone"] = pct > 3 ? "up" : pct < -3 ? "down" : "flat";
  return { recent, previous, pct, abs: recent - previous, tone };
}

/** Compare the most recent `period` days against the same length window before it. */
export function periodDelta(metrics: DayMetric[], metric: Metric, period: number): Delta {
  const vals = metrics.map((m) => m[metric]);
  const recent = avg(vals.slice(-period));
  const previous = avg(vals.slice(-period * 2, -period));
  return makeDelta(recent, previous);
}

/** Compare the two halves of the given window (used for 7/14/30-day charts). */
export function halfDelta(metrics: DayMetric[], metric: Metric): Delta {
  const vals = metrics.map((m) => m[metric]);
  const half = Math.floor(vals.length / 2);
  return makeDelta(avg(vals.slice(half)), avg(vals.slice(0, half)));
}

export function totalOf(metrics: DayMetric[], metric: Metric): number {
  return metrics.reduce((sum, m) => sum + m[metric], 0);
}

/** Consecutive days (ending today or yesterday) with score above threshold. */
export function activityStreak(metrics: DayMetric[], threshold = 50): number {
  const set = new Set(metrics.filter((m) => m.score >= threshold).map((m) => m.key));
  let streak = 0;
  const cursor = new Date();
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** % of days whose score clears the threshold. */
export function consistency(metrics: DayMetric[], threshold = 50): number {
  if (!metrics.length) return 0;
  return (metrics.filter((m) => m.score >= threshold).length / metrics.length) * 100;
}

export function bestDay(metrics: DayMetric[]): DayMetric | null {
  if (!metrics.length) return null;
  return metrics.reduce((best, m) => (m.score > best.score ? m : best), metrics[0]);
}

export interface WeekdayRow {
  label: string;
  avgScore: number;
  days: number;
}

/** Average activity score per weekday (Mon → Sun). */
export function weekdayRhythm(metrics: DayMetric[]): WeekdayRow[] {
  const buckets: Record<number, number[]> = {};
  for (const m of metrics) {
    const dow = m.date.getDay();
    (buckets[dow] ??= []).push(m.score);
  }
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dow) => ({
    label: dayLabel(new Date(1970, 0, 4 + dow)), // maps to Mon..Sun labels
    avgScore: avg(buckets[dow] ?? []),
    days: (buckets[dow] ?? []).length,
  }));
}

/** Largest day-over-day score drop in the window. */
export function biggestDip(metrics: DayMetric[]): { from: DayMetric; to: DayMetric; drop: number } | null {
  let worst: { from: DayMetric; to: DayMetric; drop: number } | null = null;
  for (let i = 1; i < metrics.length; i++) {
    const drop = metrics[i - 1].score - metrics[i].score;
    if (!worst || drop > worst.drop) worst = { from: metrics[i - 1], to: metrics[i], drop };
  }
  return worst && worst.drop > 4 ? worst : null;
}

export type InsightTone = "up" | "down" | "flat" | "tip";

export interface Insight {
  tone: InsightTone;
  title: string;
  detail: string;
}

export function getInsights(all: DayMetric[]): Insight[] {
  const out: Insight[] = [];
  const win = all.slice(-14);

  const scoreD = halfDelta(win, "score");
  if (scoreD.tone === "up") {
    out.push({
      tone: "up",
      title: `Activity up ${scoreD.pct.toFixed(0)}%`,
      detail: `Your daily score this week is averaging ${Math.round(scoreD.recent)} pts vs ${Math.round(scoreD.previous)} pts the week before.`,
    });
  } else if (scoreD.tone === "down") {
    out.push({
      tone: "down",
      title: `Activity down ${Math.abs(scoreD.pct).toFixed(0)}%`,
      detail: `Averaging ${Math.round(scoreD.recent)} pts/day this week vs ${Math.round(scoreD.previous)} previously. One focused hour can turn it around.`,
    });
  } else {
    out.push({
      tone: "flat",
      title: "Holding steady",
      detail: "Your output is consistent week over week. Push one extra focus session to break the plateau.",
    });
  }

  const focusD = periodDelta(all, "focus", 7);
  if (focusD.tone !== "flat") {
    out.push({
      tone: focusD.tone,
      title:
        focusD.tone === "up"
          ? `Deep work up ${focusD.pct.toFixed(0)}%`
          : `Deep work down ${Math.abs(focusD.pct).toFixed(0)}%`,
      detail: `Averaging ${Math.round(focusD.recent)} focus minutes/day this week, compared with ${Math.round(focusD.previous)} last week.`,
    });
  }

  const rhythm = weekdayRhythm(all.slice(-28));
  const peak = [...rhythm].sort((a, b) => b.avgScore - a.avgScore)[0];
  const low = [...rhythm].sort((a, b) => a.avgScore - b.avgScore)[0];
  if (peak && low) {
    out.push({
      tone: "tip",
      title: `${peak.label} is your power day`,
      detail: `You average ${Math.round(peak.avgScore)} pts on ${peak.label}s, while ${low.label}s lag at ${Math.round(low.avgScore)}. Schedule light, repeatable habits on ${low.label}s.`,
    });
  }

  const cons = consistency(win, 50);
  out.push({
    tone: cons >= 75 ? "up" : cons >= 50 ? "flat" : "down",
    title: `${cons.toFixed(0)}% consistent days`,
    detail:
      cons >= 75
        ? "Elite consistency — you clear 50+ points on most days. Protect the streak."
        : `${win.filter((m) => m.score >= 50).length} of your last 14 days crossed 50 points. Aim for 10.`,
  });

  const dip = biggestDip(win);
  if (dip) {
    out.push({
      tone: "down",
      title: `Biggest dip: ${dip.to.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      detail: `Activity fell ${Math.round(dip.drop)} points from the day before. Notice the pattern and plan around days like it.`,
    });
  }

  return out;
}
