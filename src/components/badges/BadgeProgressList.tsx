"use client";

import { useState, useEffect } from "react";
import { getBadgeProgress, type BadgeProgress } from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Flame,
  Dumbbell,
  Star,
  Trophy,
  Award,
  Check,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface BadgeProgressListProps {
  members: Member[];
}

export function BadgeProgressList({ members }: BadgeProgressListProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedMemberId) {
      setProgress([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getBadgeProgress(selectedMemberId).then((res) => {
      setProgress(res.data ?? []);
      setLoading(false);
    });
  }, [selectedMemberId]);

  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const generalBadges = progress.filter((p) => p.type === "general_streak");
  const sportsBadges = progress.filter((p) => p.type === "sports_streak");
  const masterBadges = progress.filter((p) => p.type === "master_of_task");

  const renderBadge = (p: BadgeProgress) => {
    const Icon = p.earned ? Check : Star;
      return (
      <div
        key={p.badgeId}
        className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
          p.earned ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20" : "border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            p.earned ? "bg-amber-200 dark:bg-amber-800/50" : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          <Icon className={`h-6 w-6 ${p.earned ? "text-amber-600" : "text-slate-500"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{p.title}</p>
          {p.taskTitle && (
            <p className="text-xs text-slate-500">Master of &quot;{p.taskTitle}&quot;</p>
          )}
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
          <p className="mt-2 text-sm font-medium">
            <span className={p.earned ? "text-amber-600" : "text-slate-600"}>
              {p.current} / {p.threshold}
            </span>
            {p.earned && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <Check className="h-4 w-4" /> Earned!
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Badge Progress
          </CardTitle>
          <p className="text-sm text-slate-500">
            Track your progress toward earning badges. Select a family member to view their stats.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Member:</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {selectedMember && (
              <div className="flex items-center gap-2">
                <MemberAvatar name={selectedMember.name} avatarUrl={selectedMember.avatar_url} size="sm" />
                <span className="text-sm text-slate-600">{selectedMember.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <p className="text-center text-slate-500">No family members found.</p>
      ) : loading ? (
        <p className="text-center text-slate-500">Loading badge progress…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Flame className="h-5 w-5 text-orange-500" />
              General Streak
            </h2>
            <div className="space-y-3">
              {generalBadges.length > 0 ? generalBadges.map(renderBadge) : (
                <p className="text-sm text-slate-500">No general streak badges yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Dumbbell className="h-5 w-5 text-purple-500" />
              Sports Streak
            </h2>
            <div className="space-y-3">
              {sportsBadges.length > 0 ? sportsBadges.map(renderBadge) : (
                <p className="text-sm text-slate-500">No sports streak badges yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Star className="h-5 w-5 text-amber-500" />
              Master of House Tasks
            </h2>
            <div className="space-y-3">
              {masterBadges.length > 0 ? masterBadges.map(renderBadge) : (
                <p className="text-sm text-slate-500">No family tasks configured yet. Add house tasks to earn Master badges!</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
