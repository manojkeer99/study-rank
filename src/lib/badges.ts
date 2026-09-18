import {
  Flame,
  Crown,
  CheckCircle2,
  Brain,
  Sprout,
  Star,
  CalendarCheck,
  TrendingUp,
  Medal,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { AppData } from "./types";
import { longestStreak } from "./date";
import {
  dailyMetrics,
  halfDelta,
  activityStreak,
  consistency,
  type DayMetric,
} from "./activity";

export type BadgeCategory = "streak" | "tasks" | "focus" | "habits" | "performance";
export type Tier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: Tier;
  icon: LucideIcon;
  current: number;
  target: number;
  unit: string;
  unlocked: boolean;
  progress: number;
}

export interface Stats {
  bestHabitStreak: number;
  tasksCompleted: number;
  habitCheckins: number;
  habitsTracked: number;
  focusMinutes: number;
  focusSessions: number;
  bestScore: number;
  avgScore7: number;
  activeStreak: number;
  consistency30: number;
  weeklyGrowth: number;
  metrics30: DayMetric[];
  points: number;
}

/* ----------------------------- XP & levels ----------------------------- */

export interface LevelInfo {
  level: number;
  title: string;
  min: number;
  points: number;
  into: number; // points earned within current level
  span: number; // points needed across current level
  progress: number; // 0..1 toward next level
  nextTitle: string | null;
  toNext: number;
}

const RANKS = [
  "Novice",
  "Starter",
  "Builder",
  "Achiever",
  "Specialist",
  "Expert",
  "Master",
  "Grandmaster",
  "Legend",
  "Mythic",
];

// cumulative XP needed to *reach* each level (index = level - 1)
const LEVEL_MIN = [0, 150, 400, 800, 1400, 2200, 3300, 4800, 7000, 10000];

export function levelFor(points: number): LevelInfo {
  let level = 1;
  for (let i = 0; i < LEVEL_MIN.length; i++) {
    if (points >= LEVEL_MIN[i]) level = i + 1;
  }
  // beyond the table, keep growing
  if (level >= LEVEL_MIN.length) {
    const extra = level - LEVEL_MIN.length + 1;
    const base = LEVEL_MIN[LEVEL_MIN.length - 1];
    const span = 4000 * extra;
    const min = base + span * (extra - 1);
    const title = RANKS[RANKS.length - 1];
    return {
      level,
      title,
      min,
      points,
      into: points - min,
      span,
      progress: Math.min(1, (points - min) / span),
      nextTitle: title,
      toNext: Math.max(0, min + span - points),
    };
  }
  const min = LEVEL_MIN[level - 1];
  const next = LEVEL_MIN[level] ?? min + 4000;
  const span = next - min;
  return {
    level,
    title: RANKS[level - 1],
    min,
    points,
    into: points - min,
    span,
    progress: Math.min(1, (points - min) / span),
    nextTitle: RANKS[level] ?? RANKS[RANKS.length - 1],
    toNext: Math.max(0, next - points),
  };
}

/* ------------------------------- Scoring ------------------------------- */

export function totalPoints(data: AppData): number {
  const tasks = data.tasks.filter((t) => t.completed).length * 10;
  const habits = data.habits.reduce((s, h) => s + h.completedDates.length, 0) * 5;
  const focus = data.sessions.reduce((s, x) => s + x.minutes, 0); // 1 point per focused minute
  return tasks + habits + focus;
}

export function computeStats(data: AppData): Stats {
  const metrics30 = dailyMetrics(data, 30);
  const metrics14 = metrics30.slice(-14);
  const bestHabitStreak = Math.max(0, ...data.habits.map((h) => longestStreak(h.completedDates)));
  return {
    bestHabitStreak,
    tasksCompleted: data.tasks.filter((t) => t.completed).length,
    habitCheckins: data.habits.reduce((s, h) => s + h.completedDates.length, 0),
    habitsTracked: data.habits.length,
    focusMinutes: data.sessions.reduce((s, x) => s + x.minutes, 0),
    focusSessions: data.sessions.length,
    bestScore: Math.max(0, ...metrics30.map((m) => m.score)),
    avgScore7:
      metrics30.slice(-7).reduce((a, m) => a + m.score, 0) / Math.min(7, metrics30.length || 1),
    activeStreak: activityStreak(metrics30, 50),
    consistency30: consistency(metrics30, 50),
    weeklyGrowth: halfDelta(metrics14, "score").pct,
    metrics30,
    points: totalPoints(data),
  };
}

/* -------------------------------- Badges ------------------------------- */

export const TIER_STYLES: Record<
  Tier,
  { label: string; hex: string; gradient: string; ring: string; glow: string }
> = {
  bronze: {
    label: "Bronze",
    hex: "#d08b4e",
    gradient: "linear-gradient(135deg,#e8a866,#a85f2c)",
    ring: "ring-amber-700/40",
    glow: "rgba(208,139,78,0.25)",
  },
  silver: {
    label: "Silver",
    hex: "#cbd5e1",
    gradient: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
    ring: "ring-slate-400/40",
    glow: "rgba(203,213,225,0.22)",
  },
  gold: {
    label: "Gold",
    hex: "#f5c451",
    gradient: "linear-gradient(135deg,#fde68a,#d99706)",
    ring: "ring-amber-400/50",
    glow: "rgba(245,196,81,0.28)",
  },
  platinum: {
    label: "Platinum",
    hex: "#67e8f9",
    gradient: "linear-gradient(135deg,#a5f3fc,#60a5fa)",
    ring: "ring-cyan-300/50",
    glow: "rgba(103,232,249,0.28)",
  },
};

type RawBadge = Omit<BadgeDef, "current" | "unlocked" | "progress"> & { value: (s: Stats) => number };

const RAW: RawBadge[] = [
  // ---------- Habit streak badges ----------
  { id: "streak-3", name: "Kindling", description: "Keep a habit alive 3 days in a row", category: "streak", tier: "bronze", icon: Flame, target: 3, unit: "days", value: (s) => s.bestHabitStreak },
  { id: "streak-7", name: "One Week Strong", description: "A 7-day habit streak", category: "streak", tier: "silver", icon: Flame, target: 7, unit: "days", value: (s) => s.bestHabitStreak },
  { id: "streak-14", name: "Fortnight Force", description: "A 14-day habit streak", category: "streak", tier: "silver", icon: Flame, target: 14, unit: "days", value: (s) => s.bestHabitStreak },
  { id: "streak-30", name: "Monthly Master", description: "A full month (30-day) streak", category: "streak", tier: "gold", icon: Flame, target: 30, unit: "days", value: (s) => s.bestHabitStreak },
  { id: "streak-90", name: "Quarterly Hero", description: "A 90-day streak", category: "streak", tier: "gold", icon: Trophy, target: 90, unit: "days", value: (s) => s.bestHabitStreak },
  { id: "streak-184", name: "Half-Year Legend", description: "A 6-month (184-day) streak", category: "streak", tier: "platinum", icon: Crown, target: 184, unit: "days", value: (s) => s.bestHabitStreak },
  { id: "streak-365", name: "Unstoppable Year", description: "A one-year (365-day) streak!", category: "streak", tier: "platinum", icon: Crown, target: 365, unit: "days", value: (s) => s.bestHabitStreak },

  // ---------- Task badges ----------
  { id: "task-1", name: "First Finish", description: "Complete your first task", category: "tasks", tier: "bronze", icon: CheckCircle2, target: 1, unit: "tasks", value: (s) => s.tasksCompleted },
  { id: "task-10", name: "Getting Things Done", description: "Complete 10 tasks", category: "tasks", tier: "bronze", icon: CheckCircle2, target: 10, unit: "tasks", value: (s) => s.tasksCompleted },
  { id: "task-50", name: "Task Crusher", description: "Complete 50 tasks", category: "tasks", tier: "silver", icon: Medal, target: 50, unit: "tasks", value: (s) => s.tasksCompleted },
  { id: "task-100", name: "Century Maker", description: "Complete 100 tasks", category: "tasks", tier: "gold", icon: Trophy, target: 100, unit: "tasks", value: (s) => s.tasksCompleted },
  { id: "task-250", name: "Unstoppable Doer", description: "Complete 250 tasks", category: "tasks", tier: "platinum", icon: Crown, target: 250, unit: "tasks", value: (s) => s.tasksCompleted },

  // ---------- Focus badges ----------
  { id: "focus-1", name: "First Focus", description: "Finish one focus session", category: "focus", tier: "bronze", icon: Brain, target: 1, unit: "sessions", value: (s) => s.focusSessions },
  { id: "focus-10", name: "Deep Worker", description: "Finish 10 focus sessions", category: "focus", tier: "silver", icon: Brain, target: 10, unit: "sessions", value: (s) => s.focusSessions },
  { id: "focus-25", name: "Flow State", description: "Finish 25 focus sessions", category: "focus", tier: "gold", icon: Brain, target: 25, unit: "sessions", value: (s) => s.focusSessions },
  { id: "focus-h10", name: "Ten Hours In", description: "Accumulate 10 focus hours", category: "focus", tier: "gold", icon: Star, target: 10, unit: "hours", value: (s) => Math.round((s.focusMinutes / 60) * 10) / 10 },
  { id: "focus-h25", name: "Deep Work Master", description: "Accumulate 25 focus hours", category: "focus", tier: "platinum", icon: Crown, target: 25, unit: "hours", value: (s) => Math.round((s.focusMinutes / 60) * 10) / 10 },

  // ---------- Habit badges ----------
  { id: "habit-track-3", name: "Habit Builder", description: "Track 3 habits", category: "habits", tier: "bronze", icon: Sprout, target: 3, unit: "habits", value: (s) => s.habitsTracked },
  { id: "habit-track-5", name: "Ritual Designer", description: "Track 5 habits", category: "habits", tier: "silver", icon: Sprout, target: 5, unit: "habits", value: (s) => s.habitsTracked },
  { id: "habit-50", name: "Check-in Pro", description: "50 total habit check-ins", category: "habits", tier: "bronze", icon: CalendarCheck, target: 50, unit: "check-ins", value: (s) => s.habitCheckins },
  { id: "habit-250", name: "Ritual Master", description: "250 total habit check-ins", category: "habits", tier: "silver", icon: CalendarCheck, target: 250, unit: "check-ins", value: (s) => s.habitCheckins },
  { id: "habit-1000", name: "Identity Shift", description: "1,000 total habit check-ins", category: "habits", tier: "gold", icon: Crown, target: 1000, unit: "check-ins", value: (s) => s.habitCheckins },

  // ---------- Performance badges ----------
  { id: "perf-day-80", name: "Great Day", description: "Score 80+ in a single day", category: "performance", tier: "silver", icon: Star, target: 80, unit: "pts", value: (s) => s.bestScore },
  { id: "perf-active-7", name: "Consistent Week", description: "7 days in a row above 50 pts", category: "performance", tier: "silver", icon: CalendarCheck, target: 7, unit: "days", value: (s) => s.activeStreak },
  { id: "perf-active-30", name: "Consistency Month", description: "30 days in a row above 50 pts", category: "performance", tier: "platinum", icon: Crown, target: 30, unit: "days", value: (s) => s.activeStreak },
  { id: "perf-avg-60", name: "High Performer", description: "Average 60+ pts over 7 days", category: "performance", tier: "gold", icon: Trophy, target: 60, unit: "pts avg", value: (s) => Math.round(s.avgScore7) },
  { id: "perf-consistency", name: "Rock Solid", description: "Stay above 50 pts on 80% of 30 days", category: "performance", tier: "gold", icon: Medal, target: 80, unit: "%", value: (s) => Math.round(s.consistency30) },
  { id: "perf-growth", name: "Rising Star", description: "Grow weekly activity 20%+", category: "performance", tier: "gold", icon: TrendingUp, target: 20, unit: "% growth", value: (s) => Math.round(Math.max(0, s.weeklyGrowth)) },
];

export function evaluateBadges(data: AppData): BadgeDef[] {
  const stats = computeStats(data);
  return RAW.map((b) => {
    const current = b.value(stats);
    const unlocked = current >= b.target;
    return {
      ...b,
      current,
      unlocked,
      progress: Math.min(1, current / b.target),
    };
  });
}

export const CATEGORY_META: Record<BadgeCategory, { label: string; icon: LucideIcon }> = {
  streak: { label: "Streaks", icon: Flame },
  tasks: { label: "Tasks", icon: CheckCircle2 },
  focus: { label: "Focus", icon: Brain },
  habits: { label: "Habits", icon: Sprout },
  performance: { label: "Performance", icon: TrendingUp },
};
