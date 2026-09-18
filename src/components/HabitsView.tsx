import { useMemo, useState } from "react";
import { Plus, Flame, Trash2, Repeat, Check, Target, CalendarCheck2 } from "lucide-react";
import type { Habit } from "../lib/types";
import { dateKey, lastNDays, dayLabel, currentStreak, todayKey } from "../lib/date";
import { accent, ACCENT_KEYS, HABIT_EMOJIS } from "../lib/colors";
import { ProgressBar } from "./ui";
import { cn } from "../utils/cn";

export function HabitsView({
  habits,
  toggleDate,
  addHabit,
  deleteHabit,
}: {
  habits: Habit[];
  toggleDate: (id: string, date: string) => void;
  addHabit: (name: string, emoji: string, color: string, target: number) => void;
  deleteHabit: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(HABIT_EMOJIS[0]);
  const [color, setColor] = useState(ACCENT_KEYS[0]);
  const [target, setTarget] = useState(7);
  const [showPicker, setShowPicker] = useState(false);

  const week = useMemo(() => lastNDays(7), []);
  const today = todayKey();

  const checkedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const bestStreak = Math.max(0, ...habits.map((h) => currentStreak(h.completedDates)));
  const weeklyCompletions = habits.reduce(
    (sum, h) => week.filter((d) => h.completedDates.includes(dateKey(d))).length + sum,
    0
  );
  const weeklyGoal = habits.reduce((s, h) => s + h.target, 0);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addHabit(trimmed, emoji, color, target);
    setName("");
    setEmoji(HABIT_EMOJIS[0]);
    setColor(ACCENT_KEYS[0]);
    setTarget(7);
    setShowPicker(false);
  };

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Habits</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Tiny repetitions, compounding results. Tap any day to check in.
        </p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Repeat className="h-5 w-5" />, label: "Active habits", value: habits.length, cls: "text-violet-400 bg-violet-500/10" },
          { icon: <CalendarCheck2 className="h-5 w-5" />, label: "Checked today", value: `${checkedToday}/${habits.length}`, cls: "text-emerald-400 bg-emerald-500/10" },
          { icon: <Flame className="h-5 w-5" />, label: "Best streak", value: `${bestStreak}d`, cls: "text-amber-400 bg-amber-500/10" },
        ].map((s, i) => (
          <div key={s.label} className="card animate-fade-up p-4 sm:p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", s.cls)}>{s.icon}</div>
            <p className="font-display text-xl font-bold sm:text-2xl">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly goal */}
      <div className="card animate-fade-up p-5" style={{ animationDelay: "120ms" }}>
        <div className="mb-2.5 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-semibold text-zinc-200">
            <Target className="h-4 w-4 text-emerald-400" /> Weekly targets
          </span>
          <span className="text-zinc-400">
            {weeklyCompletions}/{weeklyGoal} check-ins
          </span>
        </div>
        <ProgressBar value={weeklyGoal ? weeklyCompletions / weeklyGoal : 0} height={9} />
      </div>

      {/* Add habit */}
      <div className="card animate-fade-up p-5" style={{ animationDelay: "160ms" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex h-11 w-14 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30 text-xl transition hover:border-white/20"
              title="Pick an icon"
            >
              {emoji}
            </button>
            {showPicker && (
              <div className="absolute z-20 mt-2 grid w-60 grid-cols-6 gap-1.5 rounded-xl border border-white/10 bg-zinc-900 p-2.5 shadow-2xl">
                {HABIT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setEmoji(e);
                      setShowPicker(false);
                    }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-base transition hover:bg-white/10",
                      emoji === e && "bg-emerald-500/15 ring-1 ring-emerald-500/40"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={name}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            onChange={(e) => setName(e.target.value)}
            placeholder="New habit, e.g. Practice guitar"
            className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-black/30 px-2.5 py-2 ring-1 ring-white/[0.08]">
              {ACCENT_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setColor(k)}
                  aria-label={`Color ${k}`}
                  className={cn(
                    "h-5 w-5 rounded-full transition",
                    accent(k).bg,
                    color === k ? "ring-2 ring-white/70 ring-offset-2 ring-offset-zinc-900" : "opacity-60 hover:opacity-100"
                  )}
                />
              ))}
            </div>
            <select
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-sm text-zinc-300 focus:outline-none"
            >
              <option value={3}>3× / week</option>
              <option value={5}>5× / week</option>
              <option value={7}>Every day</option>
            </select>
            <button
              onClick={submit}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Habit cards */}
      <div className="space-y-3">
        {habits.length === 0 && (
          <div className="card py-14 text-center">
            <p className="text-sm font-medium text-zinc-300">No habits yet.</p>
            <p className="mt-1 text-xs text-zinc-500">Create your first one above — small is perfect.</p>
          </div>
        )}
        {habits.map((h, idx) => {
          const a = accent(h.color);
          const streak = currentStreak(h.completedDates);
          const doneThisWeek = week.filter((d) => h.completedDates.includes(dateKey(d))).length;
          const weeklyPct = doneThisWeek / h.target;
          return (
            <div
              key={h.id}
              className="card card-hover group animate-fade-up p-5"
              style={{ animationDelay: `${180 + idx * 50}ms` }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-xl ring-1", a.softBg, a.border)}>
                  {h.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-100">{h.name}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className={cn("flex items-center gap-1 text-xs font-semibold", streak > 0 ? "text-amber-400" : "text-zinc-500")}>
                      <Flame className="h-3.5 w-3.5" />
                      {streak} day{streak === 1 ? "" : "s"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {doneThisWeek}/{h.target} this week
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteHabit(h.id)}
                  aria-label="Delete habit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-1.5 sm:gap-3">
                {week.map((d) => {
                  const key = dateKey(d);
                  const done = h.completedDates.includes(key);
                  const isToday = key === today;
                  const isFuture = d > new Date() && !isToday;
                  return (
                    <button
                      key={key}
                      disabled={isFuture}
                      onClick={() => toggleDate(h.id, key)}
                      className="flex flex-1 flex-col items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-full max-w-[3.25rem] items-center justify-center rounded-xl border text-sm font-bold transition sm:h-11",
                          done
                            ? cn("border-transparent text-white", a.bg)
                            : isFuture
                              ? "border-white/[0.05] text-zinc-700"
                              : "border-white/10 text-zinc-500 hover:border-white/25 hover:bg-white/[0.04]",
                          isToday && !done && "ring-2 ring-white/20"
                        )}
                      >
                        {done ? <Check className="h-4 w-4" strokeWidth={3.5} /> : d.getDate()}
                      </span>
                      <span className={cn("text-[10px] font-semibold uppercase", isToday ? "text-emerald-400" : "text-zinc-600")}>
                        {dayLabel(d)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <ProgressBar value={Math.min(1, weeklyPct)} color={a.hex} height={5} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
