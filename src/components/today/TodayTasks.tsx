"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { playSuccessSound } from "@/lib/celebration";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { BadgeCelebrationOverlay } from "@/components/BadgeCelebrationOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  takeAndCompleteTask,
  releaseTask,
  completeTask,
  completeSportActivity,
  completeSchoolTask,
} from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { MemberAvatarPicker } from "@/components/MemberAvatarPicker";
import { Check, Dumbbell, BookOpen, Home, RotateCcw } from "lucide-react";
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

interface TodayTasksProps {
  takenTasks: TakenTask[];
  openTasks: OpenTask[];
  sportActivities: SportActivity[];
  schoolTasks: SchoolTask[];
  members: Member[];
}

function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export function TodayTasks({
  takenTasks,
  openTasks,
  sportActivities,
  schoolTasks,
  members,
}: TodayTasksProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [assigneeForTask, setAssigneeForTask] = useState<Record<string, string>>({});
  const [sportCompleterForActivity, setSportCompleterForActivity] = useState<Record<string, string>>({});
  const [schoolCompleterForTask, setSchoolCompleterForTask] = useState<Record<string, string>>({});
  const [celebrationMember, setCelebrationMember] = useState<Member | null>(null);
  const [badgeCelebration, setBadgeCelebration] = useState<{ memberName: string; badges: { title: string; description: string }[] } | null>(null);

  const getMember = (id: string) => members.find((m) => m.id === id);

  async function handleTakeAndComplete(taskId: string) {
    const assigneeId = assigneeForTask[taskId];
    if (!assigneeId) {
      alert("Select who will complete this task");
      return;
    }
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
          badges: res.newlyEarnedBadges.map((b) => ({ title: b.title, description: b.description })),
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
          badges: res.newlyEarnedBadges.map((b) => ({ title: b.title, description: b.description })),
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
    if (!activity?.member_id && !targetMemberId) {
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
          badges: res.newlyEarnedBadges.map((b) => ({ title: b.title, description: b.description })),
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
          badges: res.newlyEarnedBadges.map((b) => ({ title: b.title, description: b.description })),
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

  const hasItems =
    takenTasks.length > 0 ||
    openTasks.length > 0 ||
    sportActivities.length > 0 ||
    schoolTasks.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-xl text-slate-500">Nothing on your plate today!</p>
          <p className="mt-2 text-slate-400">Enjoy your free time 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
      {takenTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-green-600" />
              House Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {takenTasks.map((t) => (
              <motion.div
                key={t.id}
                layout
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="house">+{t.score_value} pts</Badge>
                    {(() => {
                      const m = getMember(t.assignee_id);
                      return m ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                          → {m.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleCompleteTask(t.id)}
                    disabled={completing === t.id || releasing === t.id}
                  >
                    {completing === t.id ? (
                      <>
                        <Loader size={20} className="mr-2" />
                        Completing…
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Complete
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleReleaseTask(t.id)}
                    disabled={completing === t.id || releasing === t.id}
                    title="Release task"
                  >
                    {releasing === t.id ? <Loader size={16} /> : <RotateCcw className="h-4 w-4" />}
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {openTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Tasks</CardTitle>
            <p className="text-sm text-slate-500">
              Select who completes it, then click Complete
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {openTasks.map((t) => (
              <motion.div
                key={t.id}
                layout
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <Badge variant="house" className="mt-1">
                    +{t.score_value} pts
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MemberAvatarPicker
                    members={members}
                    value={assigneeForTask[t.id] ?? ""}
                    onChange={(id) => setAssigneeForTask((p) => ({ ...p, [t.id]: id }))}
                    size="md"
                  />
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleTakeAndComplete(t.id)}
                    disabled={completing === t.id || !assigneeForTask[t.id]}
                  >
                    {completing === t.id ? (
                      <>
                        <Loader size={20} className="mr-2" />
                        Completing…
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Complete
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {sportActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-600" />
              Sport Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sportActivities.map((a) => {
              const needsCompleter = !a.member_id;
              const m = a.member_id ? getMember(a.member_id) : null;
              return (
              <motion.div
                key={a.id}
                layout
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium">{a.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="sport">+{a.score_value} pts</Badge>
                    {m ? (
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                        → {m.name}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {needsCompleter && (
                    <MemberAvatarPicker
                      members={members}
                      value={sportCompleterForActivity[a.id] ?? ""}
                      onChange={(id) => setSportCompleterForActivity((p) => ({ ...p, [a.id]: id }))}
                      size="md"
                    />
                  )}
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleCompleteSport(a.id)}
                    disabled={completing === a.id || (needsCompleter && !sportCompleterForActivity[a.id])}
                  >
                    {completing === a.id ? (
                      <>
                        <Loader size={20} className="mr-2" />
                        Completing…
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Complete
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
            })}
          </CardContent>
        </Card>
      )}

      {schoolTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              School Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schoolTasks.map((t) => {
              const needsCompleter = !t.member_id;
              const m = t.member_id ? getMember(t.member_id) : null;
              return (
                <motion.div
                  key={t.id}
                  layout
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="school">+{t.score_value} pts</Badge>
                      {t.due_date && <Badge variant="default">{t.due_date}</Badge>}
                      {m ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                          → {m.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      size="lg"
                      onClick={() => handleCompleteSchool(t.id)}
                      disabled={completing === t.id || (needsCompleter && !schoolCompleterForTask[t.id])}
                    >
                      {completing === t.id ? (
                        <>
                          <Loader size={20} className="mr-2" />
                          Completing…
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Complete
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
