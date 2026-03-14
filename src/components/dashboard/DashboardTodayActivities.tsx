"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { playSuccessSound } from "@/lib/celebration";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { BadgeCelebrationOverlay } from "@/components/BadgeCelebrationOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  takeAndCompleteTask,
  completeOpenTaskDirectly,
  releaseTask,
  completeTask,
  completeSportActivity,
  completeSchoolTask,
  dismissActivityFromToday,
  type NewlyEarnedBadge,
} from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { MemberAvatarPicker } from "@/components/MemberAvatarPicker";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { CategoryIcon } from "@/lib/category-icons";

const BENTO_COLORS = [
  "bg-bento-mint/60 dark:bg-emerald-500/20",
  "bg-bento-peach/60 dark:bg-rose-500/20",
  "bg-bento-lavender/60 dark:bg-violet-500/20",
  "bg-bento-sky/60 dark:bg-sky-500/20",
  "bg-bento-lemon/60 dark:bg-amber-500/20",
] as const;

interface TakenTask {
  id: string;
  title: string;
  score_value: number;
  assignee_id: string;
  deadline?: string | null;
}

interface OpenTask {
  id: string;
  title: string;
  score_value: number;
  default_assignee_id?: string | null;
}

interface SportActivity {
  id: string;
  title: string;
  type: string;
  score_value: number;
  member_id?: string | null;
}

interface SchoolTask {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  score_value: number;
  member_id?: string;
}

interface Member {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface DashboardTodayActivitiesProps {
  takenTasks: TakenTask[];
  openTasks: OpenTask[];
  sportActivities: SportActivity[];
  schoolTasks: SchoolTask[];
  members: Member[];
  showRemoveFromToday?: boolean;
}

function fireConfetti() {
  confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
}

export function DashboardTodayActivities({
  takenTasks,
  openTasks,
  sportActivities,
  schoolTasks,
  members,
  showRemoveFromToday = false,
}: DashboardTodayActivitiesProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [assigneeForTask, setAssigneeForTask] = useState<Record<string, string>>({});
  const [sportCompleterForActivity, setSportCompleterForActivity] = useState<Record<string, string>>({});
  const [schoolCompleterForTask, setSchoolCompleterForTask] = useState<Record<string, string>>({});
  const [celebrationMember, setCelebrationMember] = useState<Member | null>(null);
  const [badgeCelebration, setBadgeCelebration] = useState<{ memberName: string; badges: { title: string; description: string }[] } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const getMember = (id: string) => members.find((m) => m.id === id);

  async function handleRemoveFromToday(
    sourceType: "house" | "sport" | "school",
    sourceId: string
  ) {
    setRemoving(`${sourceType}-${sourceId}`);
    const res = await dismissActivityFromToday(sourceType, sourceId);
    setRemoving(null);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleTakeAndComplete(taskId: string, hasDefaultAssignee: boolean) {
    const assigneeId = assigneeForTask[taskId];
    if (!assigneeId) return;
    setCompleting(taskId);
    const res = hasDefaultAssignee
      ? await takeAndCompleteTask(taskId, assigneeId)
      : await completeOpenTaskDirectly(taskId, assigneeId);
    setCompleting(null);
    setAssigneeForTask((p) => {
      const next = { ...p };
      delete next[taskId];
      return next;
    });
    if (res.error) alert(res.error);
    else {
      const member = getMember(assigneeId);
      if (member) setCelebrationMember(member);
      if ("newlyEarnedBadges" in res && res.newlyEarnedBadges?.length && member) {
        setBadgeCelebration({
          memberName: member.name,
          badges: (res.newlyEarnedBadges as NewlyEarnedBadge[]).map((b) => ({ badgeId: b.badgeId, title: b.title, description: b.description })),
        });
      }
      playSuccessSound();
      fireConfetti();
      router.refresh();
    }
  }

  async function handleReleaseTask(taskId: string) {
    setReleasing(taskId);
    const res = await releaseTask(taskId);
    setReleasing(null);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleCompleteTask(taskId: string) {
    const task = takenTasks.find((t) => t.id === taskId);
    const member = task ? getMember(task.assignee_id) : null;
    setCompleting(taskId);
    const res = await completeTask(taskId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else {
      if (member) setCelebrationMember(member);
      if ("newlyEarnedBadges" in res && res.newlyEarnedBadges?.length && member) {
        setBadgeCelebration({
          memberName: member.name,
          badges: (res.newlyEarnedBadges as NewlyEarnedBadge[]).map((b) => ({ badgeId: b.badgeId, title: b.title, description: b.description })),
        });
      }
      playSuccessSound();
      fireConfetti();
      router.refresh();
    }
  }

  async function handleCompleteSport(activityId: string) {
    const activity = sportActivities.find((a) => a.id === activityId);
    const targetMemberId = activity?.member_id ?? sportCompleterForActivity[activityId];
    if (!targetMemberId) {
      alert("Select who completes this activity");
      return;
    }
    const member = targetMemberId ? getMember(targetMemberId) : null;
    setCompleting(activityId);
    const res = await completeSportActivity(activityId, activity?.member_id ? undefined : targetMemberId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else {
      if (member) setCelebrationMember(member);
      if ("newlyEarnedBadges" in res && res.newlyEarnedBadges?.length && member) {
        setBadgeCelebration({
          memberName: member.name,
          badges: (res.newlyEarnedBadges as NewlyEarnedBadge[]).map((b) => ({ badgeId: b.badgeId, title: b.title, description: b.description })),
        });
      }
      playSuccessSound();
      fireConfetti();
      setSportCompleterForActivity((p) => {
        const next = { ...p };
        delete next[activityId];
        return next;
      });
      router.refresh();
    }
  }

  async function handleCompleteSchool(taskId: string) {
    const task = schoolTasks.find((t) => t.id === taskId);
    const targetMemberId = task?.member_id ?? schoolCompleterForTask[taskId];
    if (!targetMemberId) {
      alert("Select who completes this activity");
      return;
    }
    const member = getMember(targetMemberId);
    setCompleting(taskId);
    const res = await completeSchoolTask(taskId, task?.member_id ? undefined : targetMemberId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else {
      if (member) setCelebrationMember(member);
      if ("newlyEarnedBadges" in res && res.newlyEarnedBadges?.length && member) {
        setBadgeCelebration({
          memberName: member.name,
          badges: (res.newlyEarnedBadges as NewlyEarnedBadge[]).map((b) => ({ badgeId: b.badgeId, title: b.title, description: b.description })),
        });
      }
      playSuccessSound();
      fireConfetti();
      setSchoolCompleterForTask((p) => {
        const next = { ...p };
        delete next[taskId];
        return next;
      });
      router.refresh();
    }
  }

  const hasHouse = takenTasks.length > 0 || openTasks.length > 0;
  const hasSport = sportActivities.length > 0;
  const hasSchool = schoolTasks.length > 0;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {celebrationMember && (
        <CelebrationOverlay
          memberName={celebrationMember.name}
          avatarUrl={celebrationMember.avatar_url}
          onComplete={() => setCelebrationMember(null)}
        />
      )}
      {badgeCelebration && (
        <BadgeCelebrationOverlay
          memberName={badgeCelebration.memberName}
          badges={badgeCelebration.badges}
          onComplete={() => setBadgeCelebration(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CategoryIcon type="house" size="sm" />
            House Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasHouse ? (
            <p className="text-sm text-slate-500">No house tasks today</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {takenTasks.map((t, i) => {
                const m = getMember(t.assignee_id);
                const colorClass = BENTO_COLORS[i % 5];
                return (
                  <motion.div
                    key={`house-taken-${t.id}`}
                    layout
                    className={`flex flex-col overflow-hidden rounded-2xl ${colorClass}`}
                  >
                    <div className="flex flex-1 items-start gap-2 p-4">
                      <CategoryIcon type="house" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{t.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="house" className="text-xs">+{t.score_value}</Badge>
                          {m && (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                              <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                              {m.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {showRemoveFromToday && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveFromToday("house", t.id)}
                          disabled={removing === `house-${t.id}`}
                          title="Remove from today"
                        >
                          {removing === `house-${t.id}` ? <Loader size={14} /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <div className="flex border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => handleCompleteTask(t.id)}
                        disabled={completing === t.id || releasing === t.id}
                        className="flex flex-1 items-center justify-center gap-2 bg-green-500/90 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-70"
                      >
                        {completing === t.id ? <Loader size={18} /> : <Check className="h-5 w-5" />}
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReleaseTask(t.id)}
                        disabled={completing === t.id || releasing === t.id}
                        className="flex items-center justify-center gap-1 border-l border-black/10 px-4 text-sm font-medium text-slate-600 hover:bg-black/5 disabled:opacity-70"
                        title="Release"
                      >
                        {releasing === t.id ? <Loader size={14} /> : <RotateCcw className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              {openTasks.map((t, i) => {
                const colorClass = BENTO_COLORS[(takenTasks.length + i) % 5];
                return (
                  <motion.div
                    key={`house-open-${t.id}`}
                    layout
                    className={`flex flex-col overflow-hidden rounded-2xl ${colorClass}`}
                  >
                    <div className="flex flex-1 items-start gap-2 p-4">
                      <CategoryIcon type="house" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{t.title}</p>
                        <Badge variant="house" className="mt-1 text-xs">+{t.score_value}</Badge>
                      </div>
                      {showRemoveFromToday && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveFromToday("house", t.id)}
                          disabled={removing === `house-${t.id}`}
                          title="Remove from today"
                        >
                          {removing === `house-${t.id}` ? <Loader size={14} /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t border-black/5 p-3">
                      <MemberAvatarPicker
                        members={members}
                        value={assigneeForTask[t.id] ?? ""}
                        onChange={(id) => setAssigneeForTask((p) => ({ ...p, [t.id]: id }))}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleTakeAndComplete(t.id, !!t.default_assignee_id)}
                        disabled={completing === t.id || !assigneeForTask[t.id]}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500/90 py-2.5 font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-70"
                      >
                        {completing === t.id ? <Loader size={18} /> : <Check className="h-5 w-5" />}
                        Complete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CategoryIcon type="sport" size="sm" />
            Sport Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasSport ? (
            <p className="text-sm text-slate-500">No sport activities today</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {sportActivities.map((a, i) => {
                const m = a.member_id ? getMember(a.member_id) : null;
                const needsCompleter = !a.member_id;
                const colorClass = BENTO_COLORS[i % 5];
                return (
                  <motion.div
                    key={`sport-${a.id}`}
                    layout
                    className={`flex flex-col overflow-hidden rounded-2xl ${colorClass}`}
                  >
                    <div className="flex flex-1 items-start gap-2 p-4">
                      <CategoryIcon type="sport" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{a.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="sport" className="text-xs">+{a.score_value}</Badge>
                          {m && (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                              <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                              {m.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {showRemoveFromToday && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveFromToday("sport", a.id)}
                          disabled={removing === `sport-${a.id}`}
                          title="Remove from today"
                        >
                          {removing === `sport-${a.id}` ? <Loader size={14} /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t border-black/5 p-3">
                      {needsCompleter && (
                        <MemberAvatarPicker
                          members={members}
                          value={sportCompleterForActivity[a.id] ?? ""}
                          onChange={(id) => setSportCompleterForActivity((p) => ({ ...p, [a.id]: id }))}
                          size="sm"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleCompleteSport(a.id)}
                        disabled={completing === a.id || (needsCompleter && !sportCompleterForActivity[a.id])}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500/90 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-70"
                      >
                        {completing === a.id ? <Loader size={18} /> : <Check className="h-5 w-5" />}
                        Complete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CategoryIcon type="school" size="sm" />
            School Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasSchool ? (
            <p className="text-sm text-slate-500">No school tasks today</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {schoolTasks.map((t, i) => {
                const m = t.member_id ? getMember(t.member_id) : null;
                const needsCompleter = !t.member_id;
                const colorClass = BENTO_COLORS[i % 5];
                return (
                  <motion.div
                    key={`school-${t.id}`}
                    layout
                    className={`flex flex-col overflow-hidden rounded-2xl ${colorClass}`}
                  >
                    <div className="flex flex-1 items-start gap-2 p-4">
                      <CategoryIcon type="school" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{t.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="school" className="text-xs">+{t.score_value}</Badge>
                          {m && (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                              <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                              {m.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {showRemoveFromToday && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveFromToday("school", t.id)}
                          disabled={removing === `school-${t.id}`}
                          title="Remove from today"
                        >
                          {removing === `school-${t.id}` ? <Loader size={14} /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t border-black/5 p-3">
                      {needsCompleter && (
                        <MemberAvatarPicker
                          members={members}
                          value={schoolCompleterForTask[t.id] ?? ""}
                          onChange={(id) => setSchoolCompleterForTask((p) => ({ ...p, [t.id]: id }))}
                          size="sm"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleCompleteSchool(t.id)}
                        disabled={completing === t.id || (needsCompleter && !schoolCompleterForTask[t.id])}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/90 py-2.5 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-70"
                      >
                        {completing === t.id ? <Loader size={18} /> : <Check className="h-5 w-5" />}
                        Complete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
