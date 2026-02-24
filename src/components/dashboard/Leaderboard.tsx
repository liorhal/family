"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import type { MemberWithStreak } from "@/lib/db/types";

interface LeaderboardProps {
  members: MemberWithStreak[];
  weeklyScores: Record<string, number>;
}

export function Leaderboard({ members, weeklyScores }: LeaderboardProps) {
  const sorted = [...members].sort(
    (a, b) => (weeklyScores[b.id] ?? 0) - (weeklyScores[a.id] ?? 0)
  );

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sorted.map((member, i) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50"
          >
            <span className="w-6 text-center font-bold text-slate-400">
              #{i + 1}
            </span>
            <MemberAvatar
              name={member.name}
              avatarUrl={member.avatar_url}
              size="md"
            />
            <div className="flex-1">
              <p className="font-medium">{member.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600">
                  {weeklyScores[member.id] ?? 0} pts
                </span>
                {(member.current_streak ?? 0) > 0 && (
                  <Badge variant="streak" className="gap-1">
                    <Flame className="h-3 w-3" />
                    {member.current_streak}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
