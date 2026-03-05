"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Podium order: 2nd (left), 1st (center), 3rd (right) for top 3
  const topThree = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const rest = sorted.slice(3);

  const renderMember = (member: MemberWithStreak, rank: number, size: "lg" | "md" | "sm") => {
    const score = monthlyScores[member.id] ?? 0;
    const trend = getTrend(member.id);
    const medalColor = rank < 3 ? MEDAL_COLORS[rank] : undefined;
    const sizeClass = size === "lg" ? "h-12 w-12 sm:h-14 sm:w-14" : size === "md" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-10 w-10 sm:h-11 sm:w-11";
    const tooltip = getTooltip(member.id);

    return (
      <div
        key={member.id}
        className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-white/60 bg-white/70 px-2 py-2 shadow-md backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-2 sm:rounded-2xl"
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
            size={size}
            className="rounded-full"
          />
          {medalColor && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-5 sm:w-5"
              style={{ backgroundColor: medalColor }}
            >
              {rank + 1}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="max-w-[64px] truncate text-center text-xs font-semibold sm:max-w-[80px] sm:text-sm">
            {member.name}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-blue-600 sm:text-base">
              {score} pts
            </span>
            {(member.current_streak ?? 0) > 0 && (
              <Badge variant="streak" className="gap-0.5 px-1.5 py-0 text-xs">
                <Flame className="h-3 w-3" />
                {member.current_streak}
              </Badge>
            )}
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
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </button>
                <AnimatePresence>
                  {openTooltipMemberId === member.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {tooltip}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden pb-1 sm:pb-2">
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        {/* Podium: 2nd (left), 1st (center), 3rd (right) - compact for phone */}
        <div className="flex w-full max-w-full items-end justify-center gap-1 sm:gap-4">
          {topThree.map((member, i) => {
            const rank = i === 0 ? 1 : i === 1 ? 0 : 2; // 2nd, 1st, 3rd
            const stepHeight = i === 0 ? "h-10 sm:h-16" : i === 1 ? "h-14 sm:h-24" : "h-8 sm:h-12";
            return (
              <div
                key={member.id}
                className="flex flex-col items-center justify-end"
              >
                {renderMember(member, rank, i === 1 ? "lg" : i === 0 ? "md" : "sm")}
                <div
                  className={`mt-1 flex w-20 min-w-[56px] items-end justify-center rounded-t-lg border border-white/80 px-1 backdrop-blur-sm sm:min-w-[72px] sm:w-24 sm:px-2 sm:min-w-[88px] ${stepHeight}`}
                  style={
                    rank < 3
                      ? { backgroundColor: `${MEDAL_COLORS[rank]}40`, borderColor: `${MEDAL_COLORS[rank]}99` }
                      : { backgroundColor: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.9)" }
                  }
                >
                  <span className="mb-1 text-xs font-bold text-slate-600 dark:text-slate-400">#{rank + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Rest of members in a row below */}
        {rest.length > 0 && (
          <div className="flex w-full flex-wrap justify-center gap-2 sm:gap-4">
            {rest.map((member, i) => renderMember(member, i + 3, "sm"))}
          </div>
        )}
      </div>
    </div>
  );
}
