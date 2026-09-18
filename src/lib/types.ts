export type View =
  | "dashboard"
  | "performance"
  | "leaderboard"
  | "rewards"
  | "tasks"
  | "habits"
  | "focus";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  createdAt: string; // ISO date
  due: string; // ISO date (yyyy-mm-dd)
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind-ish accent key
  target: number; // days per week target
  completedDates: string[]; // yyyy-mm-dd
  createdAt: string;
}

export interface FocusSession {
  id: string;
  date: string; // yyyy-mm-dd
  minutes: number;
  finishedAt: number; // epoch ms
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  sessions: FocusSession[];
}
