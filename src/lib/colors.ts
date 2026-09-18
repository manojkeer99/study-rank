export interface Accent {
  hex: string;
  text: string;
  bg: string;
  softBg: string;
  border: string;
  dot: string;
  gradientFrom: string;
  gradientTo: string;
}

export const HABIT_COLORS: Record<string, Accent> = {
  emerald: {
    hex: "#10b981",
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    softBg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    gradientFrom: "from-emerald-400",
    gradientTo: "to-teal-500",
  },
  violet: {
    hex: "#8b5cf6",
    text: "text-violet-400",
    bg: "bg-violet-500",
    softBg: "bg-violet-500/10",
    border: "border-violet-500/30",
    dot: "bg-violet-400",
    gradientFrom: "from-violet-400",
    gradientTo: "to-fuchsia-500",
  },
  amber: {
    hex: "#f59e0b",
    text: "text-amber-400",
    bg: "bg-amber-500",
    softBg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    gradientFrom: "from-amber-400",
    gradientTo: "to-orange-500",
  },
  sky: {
    hex: "#0ea5e9",
    text: "text-sky-400",
    bg: "bg-sky-500",
    softBg: "bg-sky-500/10",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
    gradientFrom: "from-sky-400",
    gradientTo: "to-cyan-500",
  },
  rose: {
    hex: "#f43f5e",
    text: "text-rose-400",
    bg: "bg-rose-500",
    softBg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
    gradientFrom: "from-rose-400",
    gradientTo: "to-pink-500",
  },
};

export const ACCENT_KEYS = Object.keys(HABIT_COLORS);

export const accent = (key: string) => HABIT_COLORS[key] ?? HABIT_COLORS.emerald;

export const PRIORITY_STYLES: Record<
  string,
  { label: string; text: string; bg: string; ring: string }
> = {
  high: {
    label: "High",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/30",
  },
  medium: {
    label: "Medium",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  low: {
    label: "Low",
    text: "text-zinc-400",
    bg: "bg-zinc-500/10",
    ring: "ring-zinc-500/30",
  },
};

export const HABIT_EMOJIS = [
  "🏃",
  "📚",
  "🧘",
  "💧",
  "🌙",
  "🥗",
  "✍️",
  "🎸",
  "🧠",
  "🦷",
  "🌱",
  "☀️",
];
