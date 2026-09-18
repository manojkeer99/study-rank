import {
  Flame,
  ListChecks,
  Timer,
  Repeat,
  ArrowRight,
  Check,
  Sparkles,
  LineChart,
} from "lucide-react";
import type { AppData, View } from "../lib/types";
import { greeting, monthLabel, currentStreak, todayKey, dayLabel } from "../lib/date";
import { accent } from "../lib/colors";
import { dailyMetrics, halfDelta, METRIC_META } from "../lib/activity";
import { Ring, StatCard, ProgressBar } from "./ui";
import { AreaChart, DeltaBadge } from "./charts";
import { NudgeBanner, RemindersCard } from "./Reminders";
import { cn } from "../utils/cn";

export function Dashboard({
  data,
  toggleTask,
  toggleHabitToday,
  setView,
}: {
  data: AppData;
  toggleTask: (id: string) => void;
  toggleHabitToday: (id: string) => void;
  setView: (v: View) => void;
}) {
  const today = todayKey();
  const todaysTasks = data.tasks.filter((t) => t.due <= today);
  const doneToday = data.tasks.filter((t) => t.completed && t.due === today).length;
  const dueToday = data.tasks.filter((t) => t.due === today).length;

  const focusToday = data.sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const habitsDoneToday = data.habits.filter((h) => h.completedDates.includes(today)).length;
  const habitCount = data.habits.length;
  const bestStreak = Math.max(0, ...data.habits.map((h) => currentStreak(h.completedDates)));

  const dayProgress =
    dueToday + habitCount === 0
      ? 0
      : (doneToday + habitsDoneToday) / (dueToday + habitCount);

  // 14-day activity trend
  const trend = dailyMetrics(data, 14);
  const trendDelta = halfDelta(trend, "score");
  const scoreMeta = METRIC_META.score;
  const trendAvg = trend.reduce((a, m) => a + m.score, 0) / trend.length;
  const trendPeak = Math.max(...trend.map((m) => m.score));

  const openTasks = todaysTasks.filter((t) => !t.completed).slice(0, 5);
  const doneTasks = todaysTasks.filter((t) => t.completed).slice(0, 3);

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Heading */}
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Sparkles className="h-4 w-4" />
            {monthLabel(now)} {now.getDate()}, {now.getFullYear()}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {greeting()}.
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            {dueToday - doneToday > 0
              ? `You have ${dueToday - doneToday} task${dueToday - doneToday === 1 ? "" : "s"} left today. You've got this.`
              : "Everything for today is cleared — go enjoy the StudyRise."}
          </p>
        </div>
        <button
          onClick={() => setView("performance")}
          className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
        >
          <LineChart className="h-4 w-4" />
          My performance
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </header>

      {/* Smart reminder banner */}
      <NudgeBanner data={data} setView={setView} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          delay={0}
          icon={<ListChecks className="h-5 w-5" />}
          label="Tasks done today"
          value={`${doneToday}/${dueToday}`}
          sub={<ProgressBar value={dueToday ? doneToday / dueToday : 0} className="mt-2" height={5} />}
          accentClass="text-emerald-400 bg-emerald-500/10"
        />
        <StatCard
          delay={60}
          icon={<Timer className="h-5 w-5" />}
          label="Focus today"
          value={`${focusToday}m`}
          sub={<span className="text-zinc-400">{Math.floor(focusToday / 60)}h {focusToday % 60}m deep work</span>}
          accentClass="text-sky-400 bg-sky-500/10"
        />
        <StatCard
          delay={120}
          icon={<Repeat className="h-5 w-5" />}
          label="Habits checked"
          value={`${habitsDoneToday}/${habitCount}`}
          sub={<ProgressBar value={habitCount ? habitsDoneToday / habitCount : 0} color="#8b5cf6" className="mt-2" height={5} />}
          accentClass="text-violet-400 bg-violet-500/10"
        />
        <StatCard
          delay={180}
          icon={<Flame className="h-5 w-5" />}
          label="Best streak"
          value={`${bestStreak}d`}
          sub={<span className="text-zinc-400">Across all habits</span>}
          accentClass="text-amber-400 bg-amber-500/10"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Activity growth graph */}
          <section className="card animate-fade-up p-6" style={{ animationDelay: "120ms" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <LineChart className="h-5 w-5 text-emerald-400" />
                  Daily activity
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Your performance score over the last 14 days — focus, tasks & habits combined
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DeltaBadge pct={trendDelta.pct} />
                <button
                  onClick={() => setView("performance")}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Details →
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-end gap-4">
              <span className="font-display text-3xl font-bold text-emerald-400">
                {Math.round(trendAvg)}
                <span className="ml-1 text-sm font-medium text-zinc-500">avg</span>
              </span>
              <span className="pb-1 text-[11px] text-zinc-500">
                Peak {trendPeak} pts · {trendDelta.tone === "up" ? "growing" : trendDelta.tone === "down" ? "declining" : "steady"} vs previous week
              </span>
            </div>

            <div className="mt-2">
              <AreaChart
                data={trend.map((m) => m.score)}
                labels={trend.map((m) => dayLabel(m.date).slice(0, 1))}
                tips={trend.map((m) =>
                  m.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                )}
                color={scoreMeta.color}
                max={100}
                height={210}
                formatTip={(v) => `${Math.round(v)} pts`}
              />
            </div>
          </section>

          {/* Today's priorities */}
          <section className="card animate-fade-up p-6" style={{ animationDelay: "180ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Today's priorities</h2>
              <button
                onClick={() => setView("tasks")}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Manage →
              </button>
            </div>
            <div className="space-y-2">
              {openTasks.length === 0 && doneTasks.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
                  No tasks scheduled. Add one from the Tasks tab.
                </p>
              )}
              {openTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-zinc-600 transition group-hover:border-emerald-400" />
                  <span className="flex-1 text-sm font-medium text-zinc-200">{t.title}</span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      t.priority === "high"
                        ? "bg-rose-500/10 text-rose-400"
                        : t.priority === "medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-500/10 text-zinc-400"
                    )}
                  >
                    {t.priority}
                  </span>
                </button>
              ))}
              {doneTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-500">
                    <Check className="h-3 w-3 text-emerald-950" strokeWidth={3.5} />
                  </span>
                  <span className="flex-1 text-sm text-zinc-500 line-through">{t.title}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Don't-forget reminders */}
          <RemindersCard data={data} toggleTask={toggleTask} setView={setView} />

          {/* Daily ring */}
          <section className="card animate-fade-up flex flex-col items-center p-6 text-center" style={{ animationDelay: "120ms" }}>
            <h2 className="self-start font-display text-lg font-semibold">Daily momentum</h2>
            <Ring size={168} stroke={13} progress={dayProgress} className="my-5">
              <span className="font-display text-4xl font-bold">{Math.round(dayProgress * 100)}%</span>
              <span className="mt-1 text-xs text-zinc-500">complete</span>
            </Ring>
            <p className="text-sm text-zinc-400">
              {dayProgress === 1
                ? "Perfect day. Beautiful. ✨"
                : dayProgress >= 0.5
                  ? "Over halfway — finish strong."
                  : "Small steps count. Check something off."}
            </p>
          </section>

          {/* Habit check-ins */}
          <section className="card animate-fade-up p-6" style={{ animationDelay: "180ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Check in</h2>
              <button
                onClick={() => setView("habits")}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                All habits →
              </button>
            </div>
            <div className="space-y-1.5">
              {data.habits.slice(0, 5).map((h) => {
                const done = h.completedDates.includes(today);
                const a = accent(h.color);
                const streak = currentStreak(h.completedDates);
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHabitToday(h.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.04]"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-base transition",
                        done ? cn(a.bg, "ring-1", a.border) : "bg-white/[0.05]"
                      )}
                    >
                      {h.emoji}
                    </span>
                    <span className={cn("flex-1 text-sm", done ? "text-zinc-500 line-through" : "text-zinc-200")}>
                      {h.name}
                    </span>
                    {streak > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Flame className="h-3 w-3" />
                        {streak}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md border-2 transition",
                        done ? "border-emerald-500 bg-emerald-500" : "border-zinc-600"
                      )}
                    >
                      {done && <Check className="h-3 w-3 text-emerald-950" strokeWidth={3.5} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
