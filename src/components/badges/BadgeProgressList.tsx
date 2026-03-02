"use client";

import { useState, useEffect } from "react";
import {
  getBadgeProgress,
  getFamilyBadgeProgress,
  type BadgeProgress,
  type FamilyBadgeEntry,
} from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Dumbbell, Star, Trophy, Award, Check, Users } from "lucide-react";

interface Member {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface BadgeProgressListProps {
  members: Member[];
}

/** Color grade by completion ratio: 0=slate, 0.25=yellow, 0.5=amber, 0.75=orange, 1=emerald */
function getBadgeColorClasses(ratio: number, earned: boolean): string {
  if (earned || ratio >= 1) {
    return "border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-900/20";
  }
  if (ratio >= 0.75) {
    return "border-orange-200 bg-orange-50/60 dark:border-orange-700 dark:bg-orange-900/20";
  }
  if (ratio >= 0.5) {
    return "border-amber-200 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/20";
  }
  if (ratio >= 0.25) {
    return "border-yellow-200 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-900/20";
  }
  return "border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30";
}

function getIconColorClasses(ratio: number, earned: boolean): string {
  if (earned || ratio >= 1) return "bg-emerald-200 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-400";
  if (ratio >= 0.5) return "bg-amber-200 text-amber-700 dark:bg-amber-800/50 dark:text-amber-400";
  if (ratio >= 0.25) return "bg-yellow-200 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-400";
  return "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400";
}

export function BadgeProgressList({ members }: BadgeProgressListProps) {
  const [view, setView] = useState<"family" | "member">("family");
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [familyEntries, setFamilyEntries] = useState<FamilyBadgeEntry[]>([]);
  const [memberProgress, setMemberProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view === "family") {
      setLoading(true);
      getFamilyBadgeProgress().then((res) => {
        setFamilyEntries(res.data ?? []);
        setLoading(false);
      });
    }
  }, [view]);

  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (view === "member" && selectedMemberId) {
      setLoading(true);
      getBadgeProgress(selectedMemberId).then((res) => {
        setMemberProgress(res.data ?? []);
        setLoading(false);
      });
    } else if (view === "member" && !selectedMemberId) {
      setMemberProgress([]);
      setLoading(false);
    }
  }, [view, selectedMemberId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const renderBadge = (
    p: BadgeProgress,
    opts?: { memberName?: string; memberAvatarUrl?: string | null }
  ) => {
    const ratio = p.threshold > 0 ? Math.min(1, p.current / p.threshold) : 0;
    const Icon = p.earned ? Check : Star;
    const borderBg = getBadgeColorClasses(ratio, p.earned);
    const iconBg = getIconColorClasses(ratio, p.earned);
    return (
      <div
        className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${borderBg}`}
      >
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          {opts?.memberName && (
            <div className="mb-1 flex items-center gap-2">
              <MemberAvatar name={opts.memberName} avatarUrl={opts.memberAvatarUrl} size="sm" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {opts.memberName}
              </span>
            </div>
          )}
          <p className="font-semibold">{p.title}</p>
          {p.taskTitle && (
            <p className="text-xs text-slate-500">Master of &quot;{p.taskTitle}&quot;</p>
          )}
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
          <p className="mt-2 text-sm font-medium">
            <span className={ratio >= 1 ? "text-emerald-600" : ratio >= 0.5 ? "text-amber-600" : "text-slate-600"}>
              {p.current} / {p.threshold}
            </span>
            {p.earned && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                <Check className="h-4 w-4" /> Earned!
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  const displayEntries =
    view === "family"
      ? familyEntries
      : memberProgress.map((p) => ({ ...p, memberId: selectedMemberId!, memberName: selectedMember?.name ?? "", memberAvatarUrl: selectedMember?.avatar_url ?? null }));

  const generalEntries = displayEntries.filter((e) => e.type === "general_streak");
  const sportsEntries = displayEntries.filter((e) => e.type === "sports_streak");
  const masterEntries = displayEntries.filter((e) => e.type === "master_of_task");

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    entries: (BadgeProgress | FamilyBadgeEntry)[],
    showMember: boolean
  ) => (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">{icon} {title}</h2>
      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map((e, i) => {
            const fe = e as FamilyBadgeEntry;
            const key = showMember ? `${fe.badgeId}-${fe.memberId}` : `${fe.badgeId}-${i}`;
            return (
              <div key={key}>
                {renderBadge(e, showMember ? { memberName: fe.memberName, memberAvatarUrl: fe.memberAvatarUrl } : undefined)}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">No badge progress yet.</p>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Badge Progress
          </CardTitle>
          <p className="text-sm text-slate-500">
            {view === "family"
              ? "Top badge achievements across the family. Completed and highest progress first."
              : "View badge progress for a specific family member."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setView("family")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  view === "family"
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
              >
                <Users className="h-4 w-4" />
                Family top
              </button>
              <button
                type="button"
                onClick={() => setView("member")}
                className={`flex items-center gap-2 rounded-r-lg px-4 py-2 text-sm font-medium transition-colors ${
                  view === "member"
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
              >
                By member
              </button>
            </div>
            {view === "member" && (
              <>
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
                  <MemberAvatar name={selectedMember.name} avatarUrl={selectedMember.avatar_url} size="sm" />
                )}
              </>
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
          {renderSection(
            "General Streak",
            <Flame className="h-5 w-5 text-orange-500" />,
            generalEntries,
            view === "family"
          )}
          {renderSection(
            "Sports Streak",
            <Dumbbell className="h-5 w-5 text-purple-500" />,
            sportsEntries,
            view === "family"
          )}
          {renderSection(
            "Master of House Tasks",
            <Star className="h-5 w-5 text-amber-500" />,
            masterEntries,
            view === "family"
          )}
        </div>
      )}
    </div>
  );
}
