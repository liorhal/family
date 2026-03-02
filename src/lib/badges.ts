import type { LucideIcon } from "lucide-react";
import { Flame, Dumbbell, Crown, Zap, Target, Star, Award, Trophy } from "lucide-react";

export type BadgeType = "general_streak" | "sports_streak" | "master_of_task";

export interface BadgeDef {
  id: string;
  type: BadgeType;
  threshold: number;
  icon: LucideIcon;
  title: string;
  description: string;
  /** For master_of_task, the task title is injected */
  taskTitle?: string;
}

export const GENERAL_STREAK_BADGES: BadgeDef[] = [
  {
    id: "general_streak_5",
    type: "general_streak",
    threshold: 5,
    icon: Zap,
    title: "On Fire! 🔥",
    description: "5 days in a row of getting stuff done. Your bed has forgotten what you look like.",
  },
  {
    id: "general_streak_10",
    type: "general_streak",
    threshold: 10,
    icon: Flame,
    title: "Unstoppable Force",
    description: "10-day streak. At this point, you're basically a productivity superhero. Cape sold separately.",
  },
  {
    id: "general_streak_20",
    type: "general_streak",
    threshold: 20,
    icon: Trophy,
    title: "Legendary Grinder",
    description: "20 days straight! Your ancestors are high-fiving from the spirit realm.",
  },
];

export const SPORTS_STREAK_BADGES: BadgeDef[] = [
  {
    id: "sports_streak_5",
    type: "sports_streak",
    threshold: 5,
    icon: Dumbbell,
    title: "Gains Beginner",
    description: "5 days of sports. Your muscles have officially introduced themselves.",
  },
  {
    id: "sports_streak_10",
    type: "sports_streak",
    threshold: 10,
    icon: Target,
    title: "Athlete in Training",
    description: "10-day sports streak. Couch? Never heard of her.",
  },
  {
    id: "sports_streak_20",
    type: "sports_streak",
    threshold: 20,
    icon: Crown,
    title: "Champion Mode",
    description: "20 days of sports! Your future self sends a thank-you note.",
  },
];

export function getMasterOfTaskBadge(taskTitle: string, threshold: number, taskId?: string): BadgeDef {
  const slug = (taskId ?? taskTitle).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const titles: Record<number, string> = {
    5: "Getting the Hang of It",
    10: "Pro Level",
    20: "Absolute Legend",
  };
  const descriptions: Record<number, string> = {
    5: `5 completions of "${taskTitle}". You're not just doing it—you're OWNING it.`,
    10: `10 times! "${taskTitle}" quivers when you walk in the room.`,
    20: `20 completions of "${taskTitle}". Call Guinness. This is record-worthy.`,
  };
  return {
    id: `master_${slug}_${threshold}`,
    type: "master_of_task",
    threshold,
    icon: Star,
    title: titles[threshold] ?? `Master of ${taskTitle}`,
    description: descriptions[threshold] ?? `Complete "${taskTitle}" ${threshold} times.`,
    taskTitle,
  };
}

export const MASTER_THRESHOLDS = [5, 10, 20] as const;
