"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { PartyPopper } from "lucide-react";
import { playSuccessSound } from "@/lib/celebration";
import { cn } from "@/lib/utils";

interface CommunityJarProps {
  currentPoints: number;
  target?: number;
  prize?: string;
}

const DEFAULT_TARGET = 1500;
const DEFAULT_PRIZE = "1,500 points = Family Movie Night 🍿";

const SESSION_KEY = "community-jar-dashboard-celebration";

export function CommunityJar({ currentPoints, target = DEFAULT_TARGET, prize = DEFAULT_PRIZE }: CommunityJarProps) {
  const goal = Math.max(1, target);
  const unlocked = currentPoints >= goal;
  const progress = Math.min(100, (currentPoints / goal) * 100);
  const coinCount = Math.min(12, Math.floor((currentPoints / goal) * 12));
  const firedRef = useRef(false);

  useEffect(() => {
    if (!unlocked || firedRef.current) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    firedRef.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");
    playSuccessSound();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.55 } });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } }), 200);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } }), 400);
  }, [unlocked]);

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm sm:px-5 sm:py-4",
        unlocked
          ? "border-emerald-300/70 bg-gradient-to-br from-emerald-50/95 via-amber-50/90 to-amber-50/80 ring-2 ring-emerald-400/35 dark:border-emerald-700/50 dark:from-emerald-950/60 dark:via-amber-950/50 dark:to-amber-950/40 dark:ring-emerald-500/25"
          : "border-amber-200/60 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/40"
      )}
    >
      {unlocked && (
        <div className="mb-3 flex flex-col items-center gap-1 border-b border-emerald-200/60 pb-3 text-center dark:border-emerald-800/40">
          <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Community jar unlocked
          </p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">You crushed the goal!</p>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{prize}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <p className="text-xs font-medium text-amber-800/90 dark:text-amber-200/90">Community Jar</p>
          <div
            className={cn(
              "relative h-20 w-16 overflow-hidden rounded-xl border-2 shadow-inner sm:h-24 sm:w-20",
              unlocked
                ? "border-emerald-400/80 bg-emerald-100/40 dark:border-emerald-600/60 dark:bg-emerald-950/40"
                : "border-amber-300/70 bg-amber-100/50 dark:border-amber-700/60 dark:bg-amber-950/30"
            )}
          >
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 transition-all duration-500",
                unlocked
                  ? "bg-gradient-to-t from-emerald-400/95 to-emerald-300/80 dark:from-emerald-600/90 dark:to-emerald-500/70"
                  : "bg-gradient-to-t from-amber-400/90 to-amber-300/70"
              )}
              style={{ height: `${progress}%` }}
            />
            <div className="absolute inset-0 flex flex-wrap content-end justify-center gap-0.5 p-1">
              {Array.from({ length: coinCount }).map((_, i) => (
                <span
                  key={i}
                  className="text-lg sm:text-xl"
                  style={{ opacity: 0.9 - i * 0.05 }}
                >
                  🪙
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-amber-900 dark:text-amber-100 sm:text-lg">
            {currentPoints.toLocaleString()} / {goal.toLocaleString()} pts
          </p>
          {!unlocked && (
            <p className="text-xs font-medium text-amber-700 sm:text-sm dark:text-amber-300/90">{prize}</p>
          )}
          {unlocked && (
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300/90">
              {currentPoints.toLocaleString()} points this month — keep it going!
            </p>
          )}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/50">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                unlocked
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-amber-400 to-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
