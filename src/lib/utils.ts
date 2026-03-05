import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return score.toLocaleString()
}

export function getDayName(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[dayIndex] ?? "?"
}

/** Check if task/activity is scheduled for today. Handles scheduled_days as numbers or strings (from DB). */
export function isScheduledForDay(
  scheduledDays: (number | string)[] | null | undefined,
  dayOfWeek: number
): boolean {
  if (!scheduledDays || scheduledDays.length === 0) return true;
  return scheduledDays.some((d) => Number(d) === dayOfWeek);
}
