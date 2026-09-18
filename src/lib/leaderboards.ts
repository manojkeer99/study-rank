import type { User } from "./auth";
import { colorIndexFor } from "./auth";
import { levelFor } from "./badges";

export interface LeaderEntry {
  uid: string;
  name: string;
  email: string;
  xp: number;
  colorIndex: number;
  rank: number;
  movement: number; // positions gained(+)/lost(-) since last week
  isYou?: boolean;
}

/* Deterministic PRNG so the field of competitors stays stable. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Aarav", "Olivia", "Liam", "Sofia", "Noah", "Mia", "Lucas", "Amara", "Ethan", "Ines",
  "Mateo", "Yuki", "Oliver", "Aisha", "Elijah", "Freya", "Hiro", "Zara", "Daniel", "Mei",
  "Leo", "Priya", "Kai", "Nora", "Arjun", "Elena", "Kenji", "Layla", "Owen", "Camila",
  "Ravi", "Tova", "Nia", "Jonas", "Diego", "Wren", "Ivan", "Hana", "Theo", "Lena",
];

const LAST = [
  "Sharma", "Garcia", "Smith", "Tanaka", "Müller", "Khan", "Rossi", "Silva", "Chen", "Okafor",
  "Nguyen", "Petrov", "Kim", "Schmidt", "Haddad", "Costa", "Yamamoto", "Diallo", "Walker", "Novak",
  "Larsen", "Moreau", "Gupta", "Ivanov", "Carter", "Berg", "Romano", "Fischer", "Adeyemi", "Sato",
  "Bauer", "Moreno", "Park", "Wagner", "Ali", "Bakker", "Sinha", "Costa", "Reyes", "Lindqvist",
];

const COMPETITOR_COUNT = 1500;
// Fake members are deliberately WEAK: the strongest bot is around 3,600 XP and
// the vast majority sit far lower (dozens to a few hundred XP), so a real,
// active user starts at the very top of the ranking.
const MAX_XP = 3800;

let cached: LeaderEntry[] | null = null;

function buildCompetitors(): LeaderEntry[] {
  if (cached) return cached;
  const rng = mulberry32(20260717);
  const used = new Set<string>();
  const out: LeaderEntry[] = [];

  while (out.length < COMPETITOR_COUNT) {
    const first = FIRST[Math.floor(rng() * FIRST.length)];
    const last = LAST[Math.floor(rng() * LAST.length)];
    let name = `${first} ${last}`;
    if (used.has(name)) {
      name = `${first} ${last[0]}.`;
      if (used.has(name)) name = `${first} ${last} ${Math.floor(rng() * 90) + 10}`;
    }
    used.add(name);

    const i = out.length;
    // Steep curve: a tiny elite near 4k, a very long low-XP tail (100, 500, …).
    const base = Math.pow(1 - i / COMPETITOR_COUNT, 1.7);
    const jitter = 0.6 + rng() * 0.35;
    const xp = Math.max(15, Math.round(MAX_XP * base * jitter));
    out.push({
      uid: `bot-${i}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
      xp,
      colorIndex: colorIndexFor(name),
      rank: 0,
      movement: Math.floor(rng() * 27) - 12,
    });
  }
  cached = out;
  return out;
}

/** Merge registered local accounts with the simulated field and rank everyone by XP. */
export function buildLeaderboard(users: User[], currentUid?: string): LeaderEntry[] {
  const bots = buildCompetitors();
  const real: LeaderEntry[] = users.map((u) => ({
    uid: u.uid,
    name: u.name,
    email: u.email,
    xp: u.xp,
    colorIndex: u.colorIndex,
    rank: 0,
    movement: 0,
    isYou: u.uid === currentUid,
  }));
  const merged = [...real, ...bots];
  merged.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  merged.forEach((e, i) => (e.rank = i + 1));
  return merged;
}

export function findRank(entries: LeaderEntry[], uid: string): LeaderEntry | undefined {
  return entries.find((e) => e.uid === uid);
}

export function nearRank(entries: LeaderEntry[], rank: number, span = 6): LeaderEntry[] {
  const start = Math.max(0, rank - 1 - span);
  const end = Math.min(entries.length, rank + span);
  return entries.slice(start, end);
}

export function rankSuffix(rank: number): string {
  const r = rank % 100;
  if (r >= 11 && r <= 13) return "th";
  switch (rank % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function levelOf(xp: number) {
  return levelFor(xp);
}
