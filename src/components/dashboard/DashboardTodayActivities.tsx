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
  releaseTask,
  completeTask,
  completeSportActivity,
  completeSchoolTask,
  dismissActivityFromToday,
} from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { MemberAvatarPicker } from "@/components/MemberAvatarPicker";
import { Check, Dumbbell, BookOpen, Home, UserPlus, RotateCcw, Trash2 } from "lucide-react";
import { Loader } from "@/components/ui/loader";

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
  const [badgeCelebration, setBadgeCelebration] = useState<{ memberName: string; badgeTitles: string[] } | null>(null);
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

  async function handleTakeAndComplete(taskId: string) {
    const assigneeId = assigneeForTask[taskId];
    if (!assigneeId) return;
    setCompleting(taskId);
    const res = await takeAndCompleteTask(taskId, assigneeId);
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
          badgeTitles: res.newlyEarnedBadges.map((b) => b.title),
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
          badgeTitles: res.newlyEarnedBadges.map((b) => b.title),
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
          badgeTitles: res.newlyEarnedBadges.map((b) => b.title),
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
          badgeTitles: res.newlyEarnedBadges.map((b) => b.title),
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

  const iconBtn = "h-11 min-h-[44px] min-w-[44px] shrink-0";
  const hasHouse = takenTasks.length > 0 || openTasks.length > 0;
  const hasSport = sportActivities.length > 0;
  const hasSchool = schoolTasks.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
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
          badgeTitles={badgeCelebration.badgeTitles}
          onComplete={() => setBadgeCelebration(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-green-600" />
            House Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasHouse ? (
            <p className="text-sm text-slate-500">No house tasks today</p>
          ) : (
            <div className="space-y-2">
              {takenTasks.map((t) => {
        const m = getMember(t.assignee_id);
        return (
          <motion.div
            key={`house-taken-${t.id}`}
            layout
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Home className="h-4 w-4 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="house" className="text-xs">+{t.score_value}</Badge>
                  {m && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                      {m.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="success"
                size="icon"
                className={iconBtn}
                onClick={() => handleCompleteTask(t.id)}
                disabled={completing === t.id || releasing === t.id}
                title="Complete"
              >
                {completing === t.id ? <Loader size={16} /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={iconBtn}
                onClick={() => handleReleaseTask(t.id)}
                disabled={completing === t.id || releasing === t.id}
                title="Release"
              >
                {releasing === t.id ? <Loader size={16} /> : <RotateCcw className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        );
              })}
              {openTasks.map((t) => (
        <motion.div
          key={`house-open-${t.id}`}
          layout
          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Home className="h-4 w-4 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.title}</p>
              <Badge variant="house" className="text-xs">+{t.score_value}</Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MemberAvatarPicker
              members={members}
              value={assigneeForTask[t.id] ?? ""}
              onChange={(id) => setAssigneeForTask((p) => ({ ...p, [t.id]: id }))}
              size="sm"
            />
            <Button
              variant="success"
              size="icon"
              className={iconBtn}
              onClick={() => handleTakeAndComplete(t.id)}
              disabled={completing === t.id || !assigneeForTask[t.id]}
              title="Complete"
            >
              {completing === t.id ? <Loader size={16} /> : <Check className="h-4 w-4" />}
            </Button>
            {showRemoveFromToday && (
              <Button
                variant="outline"
                size="icon"
                className={iconBtn}
                onClick={() => handleRemoveFromToday("house", t.id)}
                disabled={removing === `house-${t.id}`}
                title="Remove from today"
              >
                {removing === `house-${t.id}` ? <Loader size={16} className="text-slate-500" /> : <Trash2 className="h-4 w-4 text-slate-500" />}
              </Button>
            )}
          </div>
        </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-600" />
            Sport Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasSport ? (
            <p className="text-sm text-slate-500">No sport activities today</p>
          ) : (
            <div className="space-y-2">
              {sportActivities.map((a) => {
        const m = a.member_id ? getMember(a.member_id) : null;
        const needsCompleter = !a.member_id;
        return (
          <motion.div
            key={`sport-${a.id}`}
            layout
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Dumbbell className="h-4 w-4 shrink-0 text-purple-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="sport" className="text-xs">+{a.score_value}</Badge>
                  {m && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                      {m.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {needsCompleter && (
                <MemberAvatarPicker
                  members={members}
                  value={sportCompleterForActivity[a.id] ?? ""}
                  onChange={(id) => setSportCompleterForActivity((p) => ({ ...p, [a.id]: id }))}
                  size="sm"
                />
              )}
              <Button
                variant="success"
                size="icon"
                className={iconBtn}
                onClick={() => handleCompleteSport(a.id)}
                disabled={completing === a.id || (needsCompleter && !sportCompleterForActivity[a.id])}
                title="Complete"
              >
                {completing === a.id ? <Loader size={16} /> : <Check className="h-4 w-4" />}
              </Button>
              {showRemoveFromToday && (
                <Button
                  variant="outline"
                  size="icon"
                  className={iconBtn}
                  onClick={() => handleRemoveFromToday("sport", a.id)}
                  disabled={removing === `sport-${a.id}`}
                  title="Remove from today"
                >
                  {removing === `sport-${a.id}` ? <Loader size={16} className="text-slate-500" /> : <Trash2 className="h-4 w-4 text-slate-500" />}
                </Button>
              )}
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
            <BookOpen className="h-5 w-5 text-blue-600" />
            School Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasSchool ? (
            <p className="text-sm text-slate-500">No school tasks today</p>
          ) : (
            <div className="space-y-2">
              {schoolTasks.map((t) => {
        const m = t.member_id ? getMember(t.member_id) : null;
        const needsCompleter = !t.member_id;
        return (
          <motion.div
            key={`school-${t.id}`}
            layout
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="school" className="text-xs">+{t.score_value}</Badge>
                  {t.due_date && <Badge variant="default" className="text-xs">{t.due_date}</Badge>}
                  {m && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                      {m.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {needsCompleter && (
                <MemberAvatarPicker
                  members={members}
                  value={schoolCompleterForTask[t.id] ?? ""}
                  onChange={(id) => setSchoolCompleterForTask((p) => ({ ...p, [t.id]: id }))}
                  size="sm"
                />
              )}
              <Button
                variant="success"
                size="icon"
                className={iconBtn}
                onClick={() => handleCompleteSchool(t.id)}
                disabled={completing === t.id || (needsCompleter && !schoolCompleterForTask[t.id])}
                title="Complete"
              >
                {completing === t.id ? <Loader size={16} /> : <Check className="h-4 w-4" />}
              </Button>
              {showRemoveFromToday && (
                <Button
                  variant="outline"
                  size="icon"
                  className={iconBtn}
                  onClick={() => handleRemoveFromToday("school", t.id)}
                  disabled={removing === `school-${t.id}`}
                  title="Remove from today"
                >
                  {removing === `school-${t.id}` ? <Loader size={16} className="text-slate-500" /> : <Trash2 className="h-4 w-4 text-slate-500" />}
                </Button>
              )}
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
