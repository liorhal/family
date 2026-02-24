import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, subDays } from "date-fns";

import { debugLog } from "@/lib/debug-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { RealtimeLeaderboard } from "@/components/dashboard/RealtimeLeaderboard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Calendar, History } from "lucide-react";
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

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const { data: scores } = await supabase
    .from("scores_log")
    .select("member_id, score_delta, created_at")
    .gte("created_at", weekStart.toISOString());

  const weeklyByMember: Record<string, number> = {};
  for (const s of scores ?? []) {
    weeklyByMember[s.member_id] = (weeklyByMember[s.member_id] ?? 0) + s.score_delta;
  }

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
    return {
      day: format(d, "EEE"),
      score: (scores ?? []).filter(
        (s) =>
          new Date(s.created_at).toDateString() === d.toDateString() &&
          memberIds.includes(s.member_id)
      ).reduce((sum, s) => sum + s.score_delta, 0),
    };
  });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, task_assignments(member_id)")
    .eq("family_id", familyId)
    .in("status", ["open", "taken"])
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(5);

  const { data: sportActivities } = await supabase
    .from("sport_activities")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null)
    .limit(5);

  const { data: schoolTasks } = await supabase
    .from("school_tasks")
    .select("*")
    .in("member_id", (members ?? []).map((m) => m.id))
    .is("completed_at", null)
    .order("due_date", { ascending: true })
    .limit(5);

  // Activity log: last 7 days completed activities
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { data: activityScores } = await supabase
    .from("scores_log")
    .select("id, member_id, source_type, source_id, score_delta, created_at")
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
        : s.source_id
          ? titleMap[`${s.source_type}:${s.source_id}`] ?? "Unknown"
          : "Unknown";
    const m = members?.find((x) => x.id === s.member_id);
    return {
      id: s.id,
      member_id: s.member_id,
      member_name: m?.name ?? "—",
      member_avatar_url: m?.avatar_url ?? null,
      source_type: s.source_type as "house" | "sport" | "school" | "streak_bonus",
      title,
      score_delta: s.score_delta,
      created_at: s.created_at,
    };
  });

  return (
    <div className="space-y-8">
      <RealtimeLeaderboard />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Family Dashboard
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
            <Leaderboard members={membersWithStreak} weeklyScores={weeklyByMember} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Your Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-orange-100 px-6 py-4 dark:bg-orange-900/30">
                <p className="text-3xl font-bold text-orange-600">
                  {streakMap[member.id]?.current_streak ?? 0}
                </p>
                <p className="text-sm text-orange-700">Current streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">
                  Longest: {streakMap[member.id]?.longest_streak ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Weekly Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {weeklyByMember[member.id] ?? 0} pts
            </p>
            <WeeklyChart data={last7Days} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            Last 7 Days · Completed Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityLog entries={activityEntries} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>House Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks && tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map((t) => {
                  const assigneeId = (t as { task_assignments?: { member_id: string }[] }).task_assignments?.[0]?.member_id ?? t.default_assignee_id;
                  const assignee = assigneeId ? members?.find((m) => m.id === assigneeId) : null;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
                    >
                      <span>{t.title}</span>
                      <div className="flex items-center gap-2">
                        {assignee && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MemberAvatar name={assignee.name} avatarUrl={assignee.avatar_url} size="sm" />
                            {assignee.name}
                          </span>
                        )}
                        <Badge variant="house">{t.status}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500">No tasks yet. Add some in Admin!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sport Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {sportActivities && sportActivities.length > 0 ? (
              <ul className="space-y-2">
                {sportActivities.map((a) => {
                  const person = a.member_id ? members?.find((m) => m.id === a.member_id) : null;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
                    >
                      <span>{a.title}</span>
                      <div className="flex items-center gap-2">
                        {person && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MemberAvatar name={person.name} avatarUrl={person.avatar_url} size="sm" />
                            {person.name}
                          </span>
                        )}
                        <Badge variant="sport">{a.type}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500">No sport activities</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {schoolTasks && schoolTasks.length > 0 ? (
              <ul className="space-y-2">
                {schoolTasks.map((t) => {
                  const person = t.member_id ? members?.find((m) => m.id === t.member_id) : null;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
                    >
                      <span>{t.title}</span>
                      <div className="flex items-center gap-2">
                        {person && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MemberAvatar name={person.name} avatarUrl={person.avatar_url} size="sm" />
                            {person.name}
                          </span>
                        )}
                        <Badge variant="school">{format(new Date(t.due_date), "MMM d")}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500">No school tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
