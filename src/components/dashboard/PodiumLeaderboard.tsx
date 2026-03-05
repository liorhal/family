"use client";

import { MemberAvatar } from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import type { MemberWithStreak } from "@/lib/db/types";

interface PodiumLeaderboardProps {
  members: MemberWithStreak[];
  monthlyScores: Record<string, number>;
  prevMonthScores?: Record<string, number>;
  currentMonthDaysElapsed?: number;
  prevMonthDaysTotal?: number;
}

const MEDAL_COLORS = ["#fbbf24", "#94a3b8", "#d97706"] as const; // gold, silver, bronze

export function PodiumLeaderboard({
  members,
  monthlyScores,
  prevMonthScores = {},
  currentMonthDaysElapsed = 1,
  prevMonthDaysTotal = 30,
}: PodiumLeaderboardProps) {
  const sorted = [...members].sort(
    (a, b) => (monthlyScores[b.id] ?? 0) - (monthlyScores[a.id] ?? 0)
  );

  function getTrend(memberId: string) {
    const current = monthlyScores[memberId] ?? 0;
    const prev = prevMonthScores[memberId] ?? 0;
    const currentDaily = current / Math.max(1, currentMonthDaysElapsed);
    const prevDaily = prev / Math.max(1, prevMonthDaysTotal);
    if (prevDaily === 0 && currentDaily === 0) return null;
    if (currentDaily > prevDaily) return "up";
    if (currentDaily < prevDaily) return "down";
    return null;
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-1 sm:mx-0">
      <div className="flex min-w-max gap-3 px-1 sm:min-w-0 sm:flex-wrap sm:justify-center sm:gap-4">
        {sorted.map((member, i) => {
          const score = monthlyScores[member.id] ?? 0;
          const trend = getTrend(member.id);
          const medalColor = i < 3 ? MEDAL_COLORS[i] : undefined;
          const sizeClass = i === 0 ? "h-16 w-16 sm:h-20 sm:w-20" : i === 1 ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12 sm:h-14 sm:w-14";

          return (
            <div
              key={member.id}
              className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02]"
            >
              <div
                className={`relative flex ${sizeClass} items-center justify-center rounded-full ${
                  medalColor ? "ring-4 shadow-lg" : ""
                }`}
                style={
                  medalColor
                    ? {
                        boxShadow: `0 0 0 4px ${medalColor}40, 0 4px 12px rgba(0,0,0,0.1)`,
                        borderColor: medalColor,
                      }
                    : undefined
                }
              >
                <MemberAvatar
                  name={member.name}
                  avatarUrl={member.avatar_url}
                  size={i === 0 ? "lg" : i === 1 ? "md" : "sm"}
                  className="rounded-full"
                />
                {i < 3 && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: medalColor }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <p className="max-w-[80px] truncate text-center text-sm font-semibold">
                  {member.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-blue-600">
                    {score} pts
                  </span>
                  {(member.current_streak ?? 0) > 0 && (
                    <Badge variant="streak" className="gap-0.5 px-1.5 py-0 text-xs">
                      <Flame className="h-3 w-3" />
                      {member.current_streak}
                    </Badge>
                  )}
                  {trend === "up" && (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  )}
                  {trend === "down" && (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
