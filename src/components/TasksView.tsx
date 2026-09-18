import { useMemo, useState } from "react";
import { Plus, Trash2, Check, ListChecks, CalendarClock, CheckCircle2 } from "lucide-react";
import type { Priority, Task } from "../lib/types";
import { todayKey, dateKey, addDays } from "../lib/date";
import { PRIORITY_STYLES } from "../lib/colors";
import { ProgressBar } from "./ui";
import { cn } from "../utils/cn";

type Filter = "today" | "upcoming" | "completed";

const FILTERS: Array<{ id: Filter; label: string; icon: typeof ListChecks }> = [
  { id: "today", label: "Today & overdue", icon: ListChecks },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

function dueLabel(due: string): { text: string; className: string } {
  const today = todayKey();
  const tomorrow = dateKey(addDays(new Date(), 1));
  if (due < today) return { text: "Overdue", className: "text-rose-400 bg-rose-500/10" };
  if (due === today) return { text: "Today", className: "text-emerald-400 bg-emerald-500/10" };
  if (due === tomorrow) return { text: "Tomorrow", className: "text-sky-400 bg-sky-500/10" };
  const d = new Date(due + "T12:00:00");
  return {
    text: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    className: "text-zinc-400 bg-white/[0.06]",
  };
}

export function TasksView({
  tasks,
  addTask,
  toggleTask,
  deleteTask,
}: {
  tasks: Task[];
  addTask: (title: string, priority: Priority, due: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueOffset, setDueOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>("today");

  const counts = useMemo(() => {
    const today = todayKey();
    return {
      today: tasks.filter((t) => !t.completed && t.due <= today).length,
      upcoming: tasks.filter((t) => !t.completed && t.due > today).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  const visible = useMemo(() => {
    const today = todayKey();
    const sorted = [...tasks].sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.due !== b.due) return a.due.localeCompare(b.due);
      return rank[a.priority] - rank[b.priority];
    });
    if (filter === "today") return sorted.filter((t) => !t.completed && t.due <= today);
    if (filter === "upcoming") return sorted.filter((t) => !t.completed && t.due > today);
    return sorted.filter((t) => t.completed);
  }, [tasks, filter]);

  const dueTodayTotal = tasks.filter((t) => t.due === todayKey()).length;
  const doneToday = tasks.filter((t) => t.due === todayKey() && t.completed).length;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, priority, dateKey(addDays(new Date(), dueOffset)));
    setTitle("");
    setPriority("medium");
    setDueOffset(0);
  };

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Tasks</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Capture what matters, then ship it one check at a time.
        </p>
      </header>

      {/* Add task */}
      <div className="card animate-fade-up p-4" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/30 px-3.5 py-2.5 focus-within:border-emerald-500/50">
            <Plus className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Add a new task…  (press Enter)"
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-black/30 p-0.5 ring-1 ring-white/[0.08]">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize transition",
                    priority === p
                      ? cn(PRIORITY_STYLES[p].bg, PRIORITY_STYLES[p].text)
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg bg-black/30 p-0.5 ring-1 ring-white/[0.08]">
              {[
                [0, "Today"],
                [1, "Tomorrow"],
              ].map(([off, label]) => (
                <button
                  key={off}
                  onClick={() => setDueOffset(off as number)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
                    dueOffset === off ? "bg-emerald-500/15 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Today progress */}
      <div className="card animate-fade-up flex flex-wrap items-center gap-4 p-5" style={{ animationDelay: "100ms" }}>
        <div className="flex-1 min-w-52">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-200">Today's progress</span>
            <span className="text-zinc-400">
              {doneToday}/{dueTodayTotal} done
            </span>
          </div>
          <ProgressBar value={dueTodayTotal ? doneToday / dueTodayTotal : 0} height={9} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto">
        {FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              filter === id
                ? "bg-white/[0.09] text-white ring-1 ring-white/10"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                filter === id ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.07] text-zinc-400"
              )}
            >
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300">
              {filter === "completed" ? "Nothing completed yet." : "Inbox zero. Nicely done."}
            </p>
            <p className="text-xs text-zinc-500">
              {filter === "completed" ? "Finished tasks will appear here." : "Add a task above to get going."}
            </p>
          </div>
        )}
        {visible.map((t) => {
          const due = dueLabel(t.due);
          const pr = PRIORITY_STYLES[t.priority];
          return (
            <div
              key={t.id}
              className="card card-hover group animate-pop flex items-center gap-3 px-4 py-3"
            >
              <button
                onClick={() => toggleTask(t.id)}
                aria-label={t.completed ? "Mark incomplete" : "Complete task"}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition",
                  t.completed
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-zinc-600 hover:border-emerald-400"
                )}
              >
                {t.completed && <Check className="h-3.5 w-3.5 text-emerald-950" strokeWidth={3.5} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    t.completed ? "text-zinc-500 line-through" : "text-zinc-100"
                  )}
                >
                  {t.title}
                </p>
              </div>
              <span className={cn("hidden rounded-md px-2 py-1 text-[10px] font-bold sm:block", due.className)}>
                {due.text}
              </span>
              <span className={cn("rounded-md px-2 py-1 text-[10px] font-bold uppercase", pr.bg, pr.text)}>
                {pr.label}
              </span>
              <button
                onClick={() => deleteTask(t.id)}
                aria-label="Delete task"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
