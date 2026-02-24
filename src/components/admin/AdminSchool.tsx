"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSchoolTask, deleteSchoolTask, updateSchoolTask } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import type { Member } from "@/lib/db/types";
import type { SchoolTask } from "@/lib/db/types";
import { getDayName } from "@/lib/utils";
import { DayCheckboxes } from "./DayCheckboxes";

interface AdminSchoolProps {
  tasks: SchoolTask[];
  members: Member[];
}

export function AdminSchool({ tasks, members }: AdminSchoolProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleEdit(taskId: string, formData: FormData) {
    setLoading(true);
    const res = await updateSchoolTask(taskId, formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    setDeletingId(taskId);
    const res = await deleteSchoolTask(taskId);
    setDeletingId(null);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createSchoolTask(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Tasks</CardTitle>
        <p className="text-sm text-slate-500">
          Homework, exams, projects. Assign to members.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member_id">Member</Label>
              <select
                id="member_id"
                name="member_id"
                required
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Math homework" required />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Recurring days (optional) – appears on Today on these days. Leave empty for one-off.</p>
            <DayCheckboxes name="scheduled_days" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <option value="homework">Homework</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="score_value">Score</Label>
              <Input
                id="score_value"
                name="score_value"
                type="number"
                min="0"
                defaultValue="10"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">School tasks</p>
          <ul className="space-y-2">
            {tasks.slice(0, 10).map((t) => (
              <li key={t.id} className="space-y-2">
                {editingId === t.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleEdit(t.id, new FormData(e.currentTarget));
                    }}
                    className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Member</Label>
                        <select
                          name="member_id"
                          required
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                          defaultValue={t.member_id}
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Title</Label>
                        <Input name="title" defaultValue={t.title} required />
                      </div>
                    </div>
                    <div className="mt-3">
                      <DayCheckboxes name="scheduled_days" defaultDays={t.scheduled_days ?? []} />
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <select
                          name="type"
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                          defaultValue={t.type}
                        >
                          <option value="homework">Homework</option>
                          <option value="exam">Exam</option>
                          <option value="project">Project</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Due date</Label>
                        <Input name="due_date" type="date" defaultValue={t.due_date} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Score</Label>
                        <Input name="score_value" type="number" min="0" defaultValue={t.score_value} />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button type="submit" disabled={loading}>Save</Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                    <div className="flex-1">
                      <span>{t.title}</span>
                      <Badge variant="school" className="ml-2">
                        {t.type}
                      </Badge>
                      {(t.scheduled_days?.length ?? 0) > 0 && (
                        <span className="ml-2 text-xs text-slate-500">
                          ({(t.scheduled_days ?? []).map(getDayName).join(", ")})
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500">
                      {members.find((m) => m.id === t.member_id)?.name ?? "—"} · {t.due_date}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingId(t.id)}
                      title="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
