"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemberAvatar } from "@/components/MemberAvatar";
import { CategoryIcon } from "@/lib/category-icons";
import { ChevronLeft, ChevronRight, Award, Trophy, PartyPopper } from "lucide-react";
import type { MonthSummarySlide } from "@/app/actions";

interface MonthSummarySlideshowProps {
  slides: MonthSummarySlide[];
}

const slideVariants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export function MonthSummarySlideshow({ slides }: MonthSummarySlideshowProps) {
  const [index, setIndex] = useState(0);
  const current = slides[index];

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-amber-500/10 p-8 text-center">
        <p className="text-lg text-slate-600 dark:text-slate-400">No activity this month yet.</p>
        <p className="mt-2 text-sm text-slate-500">Complete activities to see your monthly recap!</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200/60 bg-gradient-to-br from-violet-50/90 via-fuchsia-50/80 to-amber-50/90 shadow-xl dark:border-violet-800/40 dark:from-violet-950/90 dark:via-fuchsia-950/80 dark:to-amber-950/80">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-200/20 via-transparent to-transparent" />
      <div className="relative flex min-h-[420px] flex-col">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={index}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="flex flex-1 flex-col items-center justify-center p-8 text-center"
            >
              {current.type === "title" && (
                <>
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400">
                    Your month in review
                  </p>
                  <h1 className="mt-4 text-4xl font-bold text-slate-800 dark:text-slate-100 sm:text-5xl">
                    {current.month} {current.year}
                  </h1>
                  <p className="mt-3 text-slate-600 dark:text-slate-400">Celebrating your wins</p>
                </>
              )}

              {current.type === "favorite_per_member" && current.memberName && current.memberTopActivities?.length && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Top activities
                  </p>
                  <MemberAvatar name={current.memberName} avatarUrl={current.memberAvatarUrl} size="lg" className="mx-auto mt-3" />
                  <p className="mt-3 text-xl font-semibold text-slate-800 dark:text-slate-100">{current.memberName}</p>
                  <div className="mt-4 w-full max-w-md space-y-3">
                    {current.memberTopActivities.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-xl bg-violet-100/80 px-4 py-3 dark:bg-violet-900/30"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <CategoryIcon type={act.activityType} size="sm" className="shrink-0" />
                          <span className="truncate font-medium text-violet-800 dark:text-violet-200">&quot;{act.title}&quot;</span>
                        </div>
                        <span className="shrink-0 text-xl font-bold text-amber-600 dark:text-amber-400">{act.count}×</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.type === "activity_champion" && current.activityTitle && current.topMembers?.length && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Activity champion
                  </p>
                  <p className="mt-2 text-xl font-bold text-violet-800 dark:text-violet-200 sm:text-2xl">&quot;{current.activityTitle}&quot;</p>
                  <div className="mt-6 flex w-full max-w-lg flex-wrap items-start justify-center gap-6">
                    {current.topMembers.map((tm, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {i === 0 ? "1st" : "2nd"}
                        </span>
                        <MemberAvatar name={tm.name} avatarUrl={tm.avatarUrl} size="lg" />
                        <p className="max-w-[8rem] truncate text-center font-semibold text-slate-800 dark:text-slate-100">{tm.name}</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tm.count}×</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.type === "busiest_weekday" && current.weekdayName && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Most productive weekday
                  </p>
                  <p className="mt-4 text-5xl font-bold text-violet-700 dark:text-violet-300">{current.weekdayName}s</p>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    {current.weekdayAvg} activities this month
                  </p>
                </>
              )}

              {current.type === "highest_day" && current.highestDayDate && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Highest day
                  </p>
                  <p className="mt-4 text-2xl font-bold text-violet-700 dark:text-violet-300 sm:text-3xl">{current.highestDayDate}</p>
                  <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {current.highestDayCount} activities · {current.highestDayPoints ?? 0} pts
                  </p>
                </>
              )}

              {current.type === "top_badges" && current.badges?.length && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Badges earned this month
                  </p>
                  <Award className="mx-auto mt-3 h-12 w-12 text-amber-500" />
                  <div className="mt-4 space-y-2">
                    {current.badges.map((b, i) => (
                      <div key={i} className="rounded-lg bg-amber-100/80 px-4 py-2 dark:bg-amber-900/30">
                        <p className="font-semibold text-amber-900 dark:text-amber-200">{b.title}</p>
                        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 line-clamp-1">{b.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {current.type === "community_jar" && current.jarTarget != null && current.jarActual != null && (
                <>
                  <PartyPopper className="mx-auto h-14 w-14 text-amber-500" />
                  <p className="mt-3 text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Community jar unlocked
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">You crushed the goal!</h2>
                  <p className="mt-3 text-lg font-semibold text-amber-700 dark:text-amber-300">
                    {current.jarActual.toLocaleString()} / {current.jarTarget.toLocaleString()} pts
                  </p>
                  <p className="mt-4 max-w-sm text-base text-slate-700 dark:text-slate-300">{current.jarPrize}</p>
                </>
              )}

              {current.type === "mvp" && current.mvpName && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Monthly MVP
                  </p>
                  <Trophy className="mx-auto mt-2 h-14 w-14 text-amber-500" />
                  <MemberAvatar name={current.mvpName} avatarUrl={current.mvpAvatarUrl} size="lg" className="mx-auto mt-2" />
                  <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{current.mvpName}</p>
                  <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">{current.mvpScore} pts</p>
                </>
              )}

              {current.type === "total_points" && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Family total
                  </p>
                  <p className="mt-6 text-6xl font-bold text-violet-700 dark:text-violet-300">{current.totalScore ?? 0}</p>
                  <p className="mt-2 text-xl font-medium text-slate-600 dark:text-slate-400">points this month</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-violet-200/50 px-4 py-3 dark:border-violet-800/40">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-violet-100 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-violet-900/50 dark:hover:text-violet-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-violet-600 dark:bg-violet-500"
                    : "w-2 bg-violet-300/60 hover:bg-violet-400/80 dark:bg-violet-700/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-violet-100 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-violet-900/50 dark:hover:text-violet-300"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
