import { useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  AlertTriangle,
  Check,
  ArrowRight,
  Brain,
  Repeat,
  PartyPopper,
  X,
  Clock3,
} from "lucide-react";
import type { AppData, View } from "../lib/types";
import { todayKey } from "../lib/date";
import { dailyMetrics } from "../lib/activity";
import { cn } from "../utils/cn";

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return { label: "Morning kick-start", verb: "Kick off today" };
  if (h < 17) return { label: "Afternoon nudge", verb: "Keep the day moving" };
  if (h < 21) return { label: "Evening wrap-up", verb: "Close out the day strong" };
  return { label: "Late-night reminder", verb: "One last thing" };
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function useReminders(data: AppData) {
  return useMemo(() => {
    const today = todayKey();
    const metrics = dailyMetrics(data, 7);
    const todayMetric = metrics[metrics.length - 1];
    const avg7 = metrics.reduce((a, m) => a + m.score, 0) / metrics.length;

    const pending = data.tasks
      .filter((t) => !t.completed && t.due <= today)
      .sort((a, b) => {
        if (a.due !== b.due) return a.due.localeCompare(b.due);
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      });
    const overdue = pending.filter((t) => t.due < today);
    const habitsLeft = data.habits.filter((h) => !h.completedDates.includes(today));
    const focusToday = todayMetric?.focus ?? 0;

    return {
      today,
      pending,
      overdue,
      habitsLeft,
      focusToday,
      todayScore: todayMetric?.score ?? 0,
      avg7,
      lowPerformance: avg7 < 42,
    };
  }, [data]);
}

/** Full-width banner shown under the dashboard header when attention is needed. */
export function NudgeBanner({
  data,
  setView,
}: {
  data: AppData;
  setView: (v: View) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const r = useReminders(data);
  const tod = timeOfDay();

  if (dismissed) return null;

  let tone: "danger" | "warn" | "focus" | "good" = "warn";
  let icon = <BellRing className="h-5 w-5" />;
  let title = "";
  let detail = "";
  let primary: { label: string; view: View } = { label: "Open tasks", view: "tasks" };

  if (r.overdue.length > 0) {
    tone = "danger";
    icon = <AlertTriangle className="h-5 w-5" />;
    title = `${r.overdue.length} task${r.overdue.length === 1 ? " is" : "s are"} overdue`;
    detail = `Don't forget: ${r.overdue
      .slice(0, 2)
      .map((t) => t.title)
      .join(", ")}${r.overdue.length > 2 ? " and more" : ""}. Knock out the quickest one first.`;
  } else if (r.pending.length > 0 && r.todayScore < 30) {
    tone = "warn";
    icon = <Clock3 className="h-5 w-5" />;
    title = `You still have ${r.pending.length} task${r.pending.length === 1 ? "" : "s"} open today`;
    detail = `${tod.verb} — ${r.pending[0]?.priority === "high" ? "a high-priority task" : "one task"} is waiting. Small wins restart momentum.`;
  } else if (r.lowPerformance && r.pending.length > 0) {
    tone = "focus";
    icon = <Brain className="h-5 w-5" />;
    title = "Your recent activity is below your usual level";
    detail = `Your 7-day average is ${Math.round(r.avg7)} pts. One focus session + one finished task will pull you back up.`;
    primary = { label: "Start a focus session", view: "focus" };
  } else if (r.pending.length === 0 && r.habitsLeft.length === 0) {
    tone = "good";
    icon = <PartyPopper className="h-5 w-5" />;
    title = "Everything is done for today";
    detail = "Tasks cleared, habits checked in. Rest well — consistency compounds.";
  } else {
    return null;
  }

  const styles = {
    danger: "bg-rose-500/[0.08] ring-rose-500/25 text-rose-300",
    warn: "bg-amber-500/[0.08] ring-amber-500/25 text-amber-300",
    focus: "bg-sky-500/[0.08] ring-sky-500/25 text-sky-300",
    good: "bg-emerald-500/[0.08] ring-emerald-500/25 text-emerald-300",
  }[tone];

  return (
    <div className={cn("animate-fade-up relative flex flex-wrap items-center gap-4 rounded-2xl p-4 ring-1 sm:px-5", styles)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-zinc-100">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{detail}</p>
      </div>
      {tone !== "good" && (
        <button
          onClick={() => setView(primary.view)}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
        >
          {primary.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss reminder"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Compact card for the dashboard side column — today's forgotten items. */
export function RemindersCard({
  data,
  toggleTask,
  setView,
}: {
  data: AppData;
  toggleTask: (id: string) => void;
  setView: (v: View) => void;
}) {
  const r = useReminders(data);
  const tod = timeOfDay();
  const allClear = r.pending.length === 0 && r.habitsLeft.length === 0 && r.focusToday > 0;

  return (
    <section className="card animate-fade-up p-6" style={{ animationDelay: "100ms" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Bell className="h-4.5 w-4.5 text-amber-400" />
          Reminders
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{tod.label}</span>
      </div>

      {allClear ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
            <PartyPopper className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">All caught up</p>
          <p className="text-xs text-zinc-500">Nothing pending. Enjoy the clear headspace.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {r.overdue.length > 0 && (
            <p className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {r.overdue.length} overdue — complete these first
            </p>
          )}

          {r.pending.slice(0, 4).map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04]"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                  t.due < r.today
                    ? "border-rose-500/60 group-hover:border-rose-400"
                    : "border-zinc-600 group-hover:border-emerald-400"
                )}
              />
              <span className="flex-1 text-left text-[13px] font-medium leading-snug text-zinc-200">
                {t.title}
              </span>
              {t.priority === "high" && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
            </button>
          ))}

          {r.pending.length > 4 && (
            <button
              onClick={() => setView("tasks")}
              className="pl-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
            >
              + {r.pending.length - 4} more open tasks
            </button>
          )}

          <div className="space-y-1.5 border-t border-white/[0.06] pt-2.5">
            {r.focusToday === 0 && (
              <button
                onClick={() => setView("focus")}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-400 transition hover:bg-white/[0.04]"
              >
                <Brain className="h-4 w-4 shrink-0 text-sky-400" />
                No focus session yet — start a 25-min block
                <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </button>
            )}
            {r.habitsLeft.length > 0 && (
              <button
                onClick={() => setView("habits")}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-400 transition hover:bg-white/[0.04]"
              >
                <Repeat className="h-4 w-4 shrink-0 text-violet-400" />
                {r.habitsLeft.length} habit{r.habitsLeft.length === 1 ? "" : "s"} not checked in
                <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {r.pending.length > 0 && (
            <button
              onClick={() => r.pending[0] && toggleTask(r.pending[0].id)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/20"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              Complete quickest task now
            </button>
          )}
        </div>
      )}
    </section>
  );
}
