"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  takeTask,
  releaseTask,
  completeTask,
  completeSportActivity,
  completeSchoolTask,
} from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Check, Dumbbell, BookOpen, Home, UserPlus, RotateCcw } from "lucide-react";

interface TakenTask {
  id: string;
  title: string;
  score_value: number;
  assignee_id: string;
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
  member_id?: string;
}

interface SchoolTask {
  id: string;
  title: string;
  type: string;
  due_date: string;
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
  const [takingTaskId, setTakingTaskId] = useState<string | null>(null);
  const [assigneeForTask, setAssigneeForTask] = useState<Record<string, string>>({});

  async function handleTakeTask(taskId: string) {
    const assigneeId = assigneeForTask[taskId] || members[0]?.id;
    if (!assigneeId) {
      alert("Select who will do this task");
      return;
    }
    setTakingTaskId(taskId);
    const res = await takeTask(taskId, assigneeId);
    setTakingTaskId(null);
    setAssigneeForTask((p) => {
      const next = { ...p };
      delete next[taskId];
      return next;
    });
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleReleaseTask(taskId: string) {
    setCompleting(taskId);
    const res = await releaseTask(taskId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleCompleteTask(taskId: string) {
    setCompleting(taskId);
    const res = await completeTask(taskId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else {
      fireConfetti();
      router.refresh();
    }
  }

  async function handleCompleteSport(activityId: string) {
    setCompleting(activityId);
    const res = await completeSportActivity(activityId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else {
      fireConfetti();
      router.refresh();
    }
  }

  async function handleCompleteSchool(taskId: string) {
    setCompleting(taskId);
    const res = await completeSchoolTask(taskId);
    setCompleting(null);
    if (res.error) alert(res.error);
    else {
      fireConfetti();
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

  const getMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div className="space-y-6">
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
                    disabled={completing === t.id}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    {completing === t.id ? "..." : "Complete"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleReleaseTask(t.id)}
                    disabled={completing === t.id}
                    title="Release task"
                  >
                    <RotateCcw className="h-4 w-4" />
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
              Take a task and assign it to a family member
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
                  <select
                    value={assigneeForTask[t.id] ?? members[0]?.id ?? ""}
                    onChange={(e) =>
                      setAssigneeForTask((p) => ({ ...p, [t.id]: e.target.value }))
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => handleTakeTask(t.id)}
                    disabled={takingTaskId === t.id || members.length === 0}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {takingTaskId === t.id ? "..." : "Take"}
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
            {sportActivities.map((a) => (
              <motion.div
                key={a.id}
                layout
                className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium">{a.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="sport">+{a.score_value} pts</Badge>
                    {(() => {
                      const m = a.member_id ? getMember(a.member_id) : null;
                      return m ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                          → {m.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => handleCompleteSport(a.id)}
                  disabled={completing === a.id}
                >
                  <Check className="mr-2 h-5 w-5" />
                  {completing === a.id ? "..." : "Complete"}
                </Button>
              </motion.div>
            ))}
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
            {schoolTasks.map((t) => (
              <motion.div
                key={t.id}
                layout
                className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="school">+{t.score_value} pts</Badge>
                    <Badge variant="default">{t.due_date}</Badge>
                    {(() => {
                      const m = t.member_id ? getMember(t.member_id) : null;
                      return m ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                          → {m.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => handleCompleteSchool(t.id)}
                  disabled={completing === t.id}
                >
                  <Check className="mr-2 h-5 w-5" />
                  {completing === t.id ? "..." : "Complete"}
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
