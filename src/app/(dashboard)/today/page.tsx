import { resetWeeklyCompletions } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { isScheduledForDay } from "@/lib/utils";
import { TodayTasks } from "@/components/today/TodayTasks";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!member) return null;

  const { data: members } = await supabase
    .from("members")
    .select("id, name, avatar_url")
    .eq("family_id", member.family_id);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayStr = format(today, "yyyy-MM-dd");

  // Reset: Thu task completed last Thu → available again this Thu. Respect due_date/deadline.
  await resetWeeklyCompletions(dayOfWeek, todayStr);

  // All taken tasks (any family member) - family-wide view
  const { data: takenAssignments } = await supabase
    .from("task_assignments")
    .select("*, tasks(*)")
    .is("completed_at", null);

  const { data: openTasksRaw } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", member.family_id)
    .eq("status", "open")
    .or(`deadline.gte.${todayStr},deadline.is.null`);

  const isTaskRelevantToday = (t: { recurring_daily?: boolean; scheduled_days?: (number | string)[] | null }) =>
    (t.recurring_daily === true) ||
    isScheduledForDay(t.scheduled_days, dayOfWeek);

  // Exclude tasks that have an active assignment (no "taken" status – assignments define "assigned")
  const assignedTaskIds = new Set(
    (takenAssignments ?? [])
      .filter((a) => {
        const t = (a as { tasks: unknown }).tasks;
        if (!t || typeof t !== "object" || !("family_id" in t)) return false;
        return (t as { family_id: string }).family_id === member.family_id;
      })
      .map((a) => (a as { task_id: string }).task_id)
  );

  const openTasks = (openTasksRaw ?? [])
    .filter((t) => !assignedTaskIds.has(t.id))
    .filter(isTaskRelevantToday)
    .sort((a, b) => {
      const aWeekly = (a.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
      const bWeekly = (b.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
      if (bWeekly !== aWeekly) return bWeekly - aWeekly;
      const da = a.deadline ?? "9999-12-31";
      const db = b.deadline ?? "9999-12-31";
      return da.localeCompare(db);
    });

  // All family sport activities (any member)
  const { data: sportActivitiesRaw } = await supabase
    .from("sport_activities")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null);

  const sportActivities = (sportActivitiesRaw ?? [])
    .filter((a) => isScheduledForDay(a.scheduled_days, dayOfWeek))
    .sort((a, b) => {
      if (a.type === "extra" && b.type !== "extra") return -1;
      if (a.type !== "extra" && b.type === "extra") return 1;
      const dayA = (a.scheduled_days?.[0] ?? 7) as number;
      const dayB = (b.scheduled_days?.[0] ?? 7) as number;
      return dayA - dayB;
    });

  // All family school tasks (any member) + research tasks (no member) - RLS filters by family
  const { data: schoolTasksRaw } = await supabase
    .from("school_tasks")
    .select("*")
    .is("completed_at", null)
    .or(`due_date.gte.${todayStr},due_date.is.null`)
    .order("due_date", { ascending: true });

  const schoolTasks = (schoolTasksRaw ?? []).filter((t) =>
    isScheduledForDay(t.scheduled_days, dayOfWeek)
  );

  // Filter taken assignments to only tasks in our family, and only tasks relevant today
  const takenTasksMapped = (takenAssignments ?? [])
    .map((a) => {
      const t = (a as { tasks: unknown }).tasks;
      if (!t || typeof t !== "object" || !("family_id" in t)) return null;
      if ((t as { family_id: string }).family_id !== member.family_id) return null;
      const task = t as unknown as { id: string; title: string; score_value: number; deadline: string | null; scheduled_days?: number[] | null; recurring_daily?: boolean };
      if (!isTaskRelevantToday(task)) return null;
      return {
        id: task.id,
        title: task.title,
        score_value: task.score_value,
        assignee_id: (a as { member_id: string }).member_id,
        deadline: task.deadline,
        scheduled_days: task.scheduled_days,
      };
    })
    .filter(Boolean) as { id: string; title: string; score_value: number; assignee_id: string; deadline: string | null; scheduled_days?: number[] | null }[];
  const takenTasksWithAssignee = takenTasksMapped.sort((a, b) => {
    const aWeekly = (a.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
    const bWeekly = (b.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
    if (bWeekly !== aWeekly) return bWeekly - aWeekly;
    const da = a.deadline ?? "9999-12-31";
    const db = b.deadline ?? "9999-12-31";
    return da.localeCompare(db);
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Today</h1>

      <TodayTasks
        takenTasks={takenTasksWithAssignee}
        openTasks={openTasks}
        sportActivities={sportActivities ?? []}
        schoolTasks={schoolTasks ?? []}
        members={members ?? []}
      />
    </div>
  );
}
