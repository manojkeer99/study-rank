import type { AppData, Habit, Task, FocusSession } from "./types";
import { dateKey, addDays, uid } from "./date";

const HABIT_COLORS = ["emerald", "violet", "amber", "sky", "rose"];

/** Deterministic pseudo-random so the demo data looks organic but stable. */
function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function isWeekend(d: Date) {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

/** Recent week trends upward, with a visible slump 9–11 days back. */
function trendFor(back: number): number {
  if (back <= 6) return 1.3;
  if (back >= 9 && back <= 11) return 0.32;
  if (back <= 15) return 0.95;
  return 0.78;
}

function seedHabits(): Habit[] {
  const templates: Array<[string, string, number, number]> = [
    ["Morning workout", "🏃", 5, 88],
    ["Read 20 pages", "📚", 7, 92],
    ["Meditate", "🧘", 7, 95],
    ["Drink 2L water", "💧", 7, 86],
    ["No screens after 10pm", "🌙", 5, 68],
  ];

  return templates.map(([name, emoji, target, fillPct], i) => {
    const dates: string[] = [];
    for (let back = 120; back >= 0; back--) {
      const rnd = rand((i + 1) * 999 + back * 37);
      if (rnd < fillPct / 100) dates.push(dateKey(addDays(new Date(), -back)));
    }
    // leave today open for the user to check in
    return {
      id: uid(),
      name,
      emoji,
      color: HABIT_COLORS[i % HABIT_COLORS.length],
      target,
      completedDates: dates.filter((d) => d !== dateKey(new Date())),
      createdAt: dateKey(addDays(new Date(), -120)),
    };
  });
}

const HISTORICAL_TITLES = [
  "Inbox zero",
  "Team standup notes",
  "Write spec section",
  "Review design mockups",
  "Deep work block",
  "Pay bills",
  "Read 30 minutes",
  "Reply to client emails",
  "Update roadmap",
  "Code review",
  "Plan the week",
  "File expenses",
  "Ship bug fix",
  "Prep presentation",
  "Organize notes",
  "1:1 prep notes",
  "Research spike",
  "Write tests",
  "Clean up downloads",
  "Backup photos",
];

function seedTasks(): Task[] {
  const today = dateKey(new Date());
  const tomorrow = dateKey(addDays(new Date(), 1));
  const yesterday = dateKey(addDays(new Date(), -1));

  const curated: Task[] = [
    ["Finalize quarterly roadmap deck", "high", false, today],
    ["Reply to design feedback", "medium", false, today],
    ["30 min deep-work: API spec", "high", false, today],
    ["Grocery run", "low", false, today],
    ["Call the dentist", "medium", false, tomorrow],
    ["Draft newsletter outline", "medium", false, tomorrow],
    ["Update expense report", "low", false, tomorrow],
    ["Review pull requests", "high", true, yesterday],
    ["Weekly planning", "medium", true, yesterday],
    ["Tidy desk", "low", true, today],
  ].map(([title, priority, completed, due]) => ({
    id: uid(),
    title: title as string,
    priority: priority as Task["priority"],
    completed: completed as boolean,
    due: due as string,
    createdAt: yesterday,
  }));

  const history: Task[] = [];
  for (let back = 1; back <= 21; back++) {
    const day = addDays(new Date(), -back);
    const key = dateKey(day);
    const base = isWeekend(day) ? 0.7 : 2.6;
    const count = Math.round(base * trendFor(back) * (0.45 + rand(back * 3.31 + 5) * 0.85));
    for (let k = 0; k < count; k++) {
      const r = rand(back * 17.7 + k * 13.1);
      history.push({
        id: uid(),
        title: HISTORICAL_TITLES[(back * 7 + k) % HISTORICAL_TITLES.length],
        priority: r > 0.8 ? "high" : r > 0.45 ? "medium" : "low",
        completed: true,
        due: key,
        createdAt: key,
      });
    }
  }

  return [...curated, ...history];
}

function seedSessions(): FocusSession[] {
  const sessions: FocusSession[] = [];
  for (let back = 34; back >= 0; back--) {
    const day = addDays(new Date(), -back);
    const key = dateKey(day);
    const base = isWeekend(day) ? 1 : 2.4;
    const count = Math.round(base * trendFor(back) * (0.45 + rand(back * 7.13 + 3) * 0.9));
    for (let k = 0; k < count; k++) {
      const minutes = rand(back * 5.9 + k * 11.3) < 0.25 ? 50 : 25;
      sessions.push({
        id: uid(),
        date: key,
        minutes,
        finishedAt: day.getTime() + (9 + k * 2) * 3600 * 1000,
      });
    }
  }
  return sessions;
}

export function buildSeed(): AppData {
  return {
    habits: seedHabits(),
    tasks: seedTasks(),
    sessions: seedSessions(),
  };
}
