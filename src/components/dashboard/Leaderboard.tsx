"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import type { MemberWithStreak } from "@/lib/db/types";

interface LeaderboardProps {
  members: MemberWithStreak[];
  monthlyScores: Record<string, number>;
  prevMonthScores?: Record<string, number>;
  currentMonthDaysElapsed?: number;
  prevMonthDaysTotal?: number;
}

export function Leaderboard({
  members,
  monthlyScores,
  prevMonthScores = {},
  currentMonthDaysElapsed = 1,
  prevMonthDaysTotal = 30,
}: LeaderboardProps) {
  const [openTooltipMemberId, setOpenTooltipMemberId] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openTooltipMemberId) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (target instanceof Element && target.closest("[data-trend-button]")) return;
      if (tooltipRef.current?.contains(target)) return;
      setOpenTooltipMemberId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openTooltipMemberId]);

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

  function getTooltip(memberId: string) {
    const current = monthlyScores[memberId] ?? 0;
    const prev = prevMonthScores[memberId] ?? 0;
    const currentDaily = (current / Math.max(1, currentMonthDaysElapsed)).toFixed(1);
    const prevDaily = (prev / Math.max(1, prevMonthDaysTotal)).toFixed(1);
    return `This month: ${currentDaily} pts/day · Last month: ${prevDaily} pts/day`;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sorted.map((member, i) => {
          const trend = getTrend(member.id);
          const tooltip = getTooltip(member.id);
          return (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50"
            >
              <span className="w-6 shrink-0 text-center font-bold text-slate-400">
                #{i + 1}
              </span>
              <MemberAvatar
                name={member.name}
                avatarUrl={member.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{member.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-600">
                    {monthlyScores[member.id] ?? 0} pts
                  </span>
                  {(member.current_streak ?? 0) > 0 && (
                    <Badge variant="streak" className="gap-1">
                      <Flame className="h-3 w-3" />
                      {member.current_streak}
                    </Badge>
                  )}
                </div>
              </div>
              {trend && (
                <div ref={openTooltipMemberId === member.id ? tooltipRef : undefined} className="relative shrink-0">
                  <button
                    type="button"
                    data-trend-button
                    className="touch-manipulation rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    title={tooltip}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipMemberId((prev) => (prev === member.id ? null : member.id));
                    }}
                    aria-label={tooltip}
                  >
                    {trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openTooltipMemberId === member.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full right-0 z-50 mb-1 max-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {tooltip}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
