import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subMonths, subDays, differenceInDays } from "date-fns";

import { debugLog } from "@/lib/debug-log";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Family Dashboard" };

  const { data: member } = await supabase
    .from("members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!member) return { title: "Family Dashboard" };

  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", member.family_id)
    .single();

  const title = family?.name ? `${family.name} Family Dashboard` : "Family Dashboard";
  return { title };
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { DashboardTodayActivities } from "@/components/dashboard/DashboardTodayActivities";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { RealtimeLeaderboard } from "@/components/dashboard/RealtimeLeaderboard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { Flame, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  // #region agent log
  debugLog("dashboard/page.tsx", "dashboard_entry", { hypothesisId: "H4" });
  // #endregion
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // #region agent log
  debugLog("dashboard/page.tsx", "dashboard_after_getUser", { hypothesisId: "H3,H4", hasUser: !!user });
  // #endregion
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();
  // #region agent log
  debugLog("dashboard/page.tsx", "dashboard_after_member", { hypothesisId: "H4", hasMember: !!member });
  // #endregion
  if (!member) return null;

  const familyId = member.family_id;

  // #region agent log
  debugLog("dashboard/page.tsx", "dashboard_before_members", { hypothesisId: "H4", familyId });
  // #endregion
  const { data: family } = await supabase
    .from("families")
    .select("name, show_reset_button")
    .eq("id", familyId)
    .single();

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", familyId);

  const { data: streaks } = await supabase
    .from("streaks")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id));

  const streakMap = Object.fromEntries(
    (streaks ?? []).map((s) => [s.member_id, s])
  );

  const now = new Date();
  const monthStart = startOfMonth(now);
  const { data: scores } = await supabase
    .from("scores_log")
    .select("member_id, source_type, score_delta, created_at")
    .gte("created_at", monthStart.toISOString());

  const monthlyByMember: Record<string, number> = {};
  for (const s of scores ?? []) {
    const delta = s.source_type === "fine" ? -s.score_delta : s.score_delta;
    monthlyByMember[s.member_id] = (monthlyByMember[s.member_id] ?? 0) + delta;
  }

  // Previous month scores for winner
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const { data: prevMonthScores } = await supabase
    .from("scores_log")
    .select("member_id, source_type, score_delta")
    .gte("created_at", prevMonthStart.toISOString())
    .lte("created_at", prevMonthEnd.toISOString());

  const prevMonthByMember: Record<string, number> = {};
  for (const s of prevMonthScores ?? []) {
    const delta = s.source_type === "fine" ? -s.score_delta : s.score_delta;
    prevMonthByMember[s.member_id] = (prevMonthByMember[s.member_id] ?? 0) + delta;
  }
  const prevMonthWinnerId = Object.entries(prevMonthByMember).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] ?? null;
  const prevMonthWinner = prevMonthWinnerId
    ? members?.find((m) => m.id === prevMonthWinnerId)
    : null;

  const daysToEndOfMonth = differenceInDays(endOfMonth(now), now) + 1;

  // #region agent log
  debugLog("dashboard/page.tsx", "dashboard_data_ready", { hypothesisId: "H4", membersCount: (members ?? []).length });
  // #endregion
  const membersWithStreak = (members ?? []).map((m) => ({
    ...m,
    current_streak: streakMap[m.id]?.current_streak ?? 0,
    longest_streak: streakMap[m.id]?.longest_streak ?? 0,
  }));

  const memberIds = (members ?? []).map((m) => m.id);
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const row: Record<string, string | number> = {
      day: format(d, "EEE"),
    };
    for (const m of members ?? []) {
      row[m.id] = (scores ?? []).filter(
        (s) =>
          new Date(s.created_at).toDateString() === d.toDateString() &&
          s.member_id === m.id
      ).reduce((sum, s) => sum + (s.source_type === "fine" ? -s.score_delta : s.score_delta), 0);
    }
    return row;
  });

  // Today's activities (house, sport, school)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayStr = format(today, "yyyy-MM-dd");

  const { data: takenAssignments } = await supabase
    .from("task_assignments")
    .select("*, tasks(*)")
    .is("completed_at", null);

  const { data: openTasksRaw } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", familyId)
    .eq("status", "open")
    .or(`deadline.gte.${todayStr},deadline.is.null`);

  const openTasks = (openTasksRaw ?? [])
    .filter(
      (t) =>
        !t.scheduled_days ||
        t.scheduled_days.length === 0 ||
        t.scheduled_days.includes(dayOfWeek)
    )
    .sort((a, b) => {
      const da = a.deadline ?? "9999-12-31";
      const db = b.deadline ?? "9999-12-31";
      return da.localeCompare(db);
    });

  const { data: sportActivitiesRaw } = await supabase
    .from("sport_activities")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null);

  const sportActivities = (sportActivitiesRaw ?? [])
    .filter(
      (a) =>
        a.type === "extra" ||
        ((a.scheduled_days?.length ?? 0) > 0 && a.scheduled_days!.includes(dayOfWeek))
    )
    .sort((a, b) => {
      if (a.type === "extra" && b.type !== "extra") return -1;
      if (a.type !== "extra" && b.type === "extra") return 1;
      const dayA = (a.scheduled_days?.[0] ?? 7) as number;
      const dayB = (b.scheduled_days?.[0] ?? 7) as number;
      return dayA - dayB;
    });

  const { data: schoolTasksRaw } = await supabase
    .from("school_tasks")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null)
    .gte("due_date", todayStr)
    .order("due_date", { ascending: true });

  const schoolTasks = (schoolTasksRaw ?? []).filter(
    (t) =>
      !t.scheduled_days ||
      t.scheduled_days.length === 0 ||
      t.scheduled_days.includes(dayOfWeek)
  );

  const takenTasksMapped = (takenAssignments ?? [])
    .map((a) => {
      const t = (a as { tasks: unknown }).tasks;
      if (!t || typeof t !== "object" || !("family_id" in t)) return null;
      if ((t as { family_id: string }).family_id !== familyId) return null;
      const task = t as unknown as { id: string; title: string; score_value: number; deadline: string | null };
      return {
        id: task.id,
        title: task.title,
        score_value: task.score_value,
        assignee_id: (a as { member_id: string }).member_id,
        deadline: task.deadline,
      };
    })
    .filter(Boolean) as { id: string; title: string; score_value: number; assignee_id: string; deadline: string | null }[];

  const takenTasks = takenTasksMapped.sort((a, b) => {
    const da = a.deadline ?? "9999-12-31";
    const db = b.deadline ?? "9999-12-31";
    return da.localeCompare(db);
  });

  // Activity log: last 7 days completed activities
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { data: activityScores } = await supabase
    .from("scores_log")
    .select("id, member_id, source_type, source_id, score_delta, description, created_at")
    .in("member_id", (members ?? []).map((m) => m.id))
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(50);

  const houseIds = (activityScores ?? [])
    .filter((s) => s.source_type === "house" && s.source_id)
    .map((s) => s.source_id as string);
  const sportIds = (activityScores ?? [])
    .filter((s) => s.source_type === "sport" && s.source_id)
    .map((s) => s.source_id as string);
  const schoolIds = (activityScores ?? [])
    .filter((s) => s.source_type === "school" && s.source_id)
    .map((s) => s.source_id as string);

  const [houseTasksForLog, sportActivitiesForLog, schoolTasksForLog] = await Promise.all([
    houseIds.length > 0
      ? supabase.from("tasks").select("id, title").in("id", houseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    sportIds.length > 0
      ? supabase.from("sport_activities").select("id, title").in("id", sportIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    schoolIds.length > 0
      ? supabase.from("school_tasks").select("id, title").in("id", schoolIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const titleMap: Record<string, string> = {};
  for (const t of houseTasksForLog.data ?? []) titleMap[`house:${t.id}`] = t.title;
  for (const a of sportActivitiesForLog.data ?? []) titleMap[`sport:${a.id}`] = a.title;
  for (const t of schoolTasksForLog.data ?? []) titleMap[`school:${t.id}`] = t.title;

  const activityEntries = (activityScores ?? []).map((s) => {
    const title =
      s.source_type === "streak_bonus"
        ? "Streak bonus"
        : s.source_type === "bonus"
          ? (s as { description?: string | null }).description || "Bonus"
          : s.source_type === "fine"
            ? (s as { description?: string | null }).description || "Fine"
            : s.source_id
              ? titleMap[`${s.source_type}:${s.source_id}`] ?? "Unknown"
              : "Unknown";
    const m = members?.find((x) => x.id === s.member_id);
    return {
      id: s.id,
      member_id: s.member_id,
      member_name: m?.name ?? "—",
      member_avatar_url: m?.avatar_url ?? null,
      source_type: s.source_type as "house" | "sport" | "school" | "streak_bonus" | "bonus" | "fine",
      source_id: s.source_id,
      title,
      score_delta: s.source_type === "fine" ? -s.score_delta : s.score_delta,
      created_at: s.created_at,
    };
  });

  return (
    <div className="space-y-8">
      <RealtimeLeaderboard />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {family?.name ? `${family.name} Family Dashboard` : "Family Dashboard"}
        </h1>
        <Button asChild size="lg">
          <Link href="/today">
            <Plus className="mr-2 h-5 w-5" />
            Quick Add
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard members={membersWithStreak} monthlyScores={monthlyByMember} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Monthly score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(monthlyByMember).reduce((sum, n) => sum + n, 0)} pts
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Longest streak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.max(...(members ?? []).map((m) => streakMap[m.id]?.longest_streak ?? 0), 0)} days
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Previous month winner</p>
                <p className="text-2xl font-bold text-amber-600">
                  {prevMonthWinner ? prevMonthWinner.name : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Days to end of month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {daysToEndOfMonth} day{daysToEndOfMonth !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-600">Last 7 days</p>
              <WeeklyChart data={last7Days} members={members ?? []} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Last 7 Days · Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityLog
              entries={activityEntries}
              members={members ?? []}
              showResetButton={family?.show_reset_button ?? false}
            />
          </CardContent>
        </Card>
      </div>

      <DashboardTodayActivities
        takenTasks={takenTasks}
        openTasks={openTasks}
        sportActivities={sportActivities}
        schoolTasks={schoolTasks}
        members={members ?? []}
      />
    </div>
  );
}
