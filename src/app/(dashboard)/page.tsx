import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subMonths, subDays, differenceInDays, getDate, getDaysInMonth } from "date-fns";
import { isScheduledForDay } from "@/lib/utils";

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
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { CommunityJar } from "@/components/dashboard/CommunityJar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTodayActivities } from "@/components/dashboard/DashboardTodayActivities";
import { PodiumLeaderboard } from "@/components/dashboard/PodiumLeaderboard";
import { RealtimeLeaderboard } from "@/components/dashboard/RealtimeLeaderboard";
import { Calendar } from "lucide-react";
import { FeelingLuckyButton } from "@/components/dashboard/FeelingLuckyButton";

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
    .select("name, show_reset_button, show_remove_from_today, jar_target, jar_prize, dashboard_header")
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

  // Best day: daily totals from last 90 days
  const ninetyDaysAgo = subDays(now, 90).toISOString();
  const { data: scoresForBestDay } = await supabase
    .from("scores_log")
    .select("member_id, source_type, score_delta, created_at")
    .in("member_id", (members ?? []).map((m) => m.id))
    .gte("created_at", ninetyDaysAgo);
  const dailyTotals: Record<string, number> = {};
  for (const s of scoresForBestDay ?? []) {
    const dateKey = format(new Date(s.created_at), "yyyy-MM-dd");
    const delta = s.source_type === "fine" ? -s.score_delta : s.score_delta;
    dailyTotals[dateKey] = (dailyTotals[dateKey] ?? 0) + delta;
  }
  const bestDayEntry = Object.entries(dailyTotals).sort(([, a], [, b]) => b - a)[0];
  const bestDay = bestDayEntry
    ? { date: bestDayEntry[0], score: bestDayEntry[1] }
    : null;

  // Best month: family total per month (last 24 months)
  const twoYearsAgo = subMonths(now, 24).toISOString();
  const { data: scoresForBestMonth } = await supabase
    .from("scores_log")
    .select("member_id, source_type, score_delta, created_at")
    .in("member_id", (members ?? []).map((m) => m.id))
    .gte("created_at", twoYearsAgo);
  const monthlyTotals: Record<string, number> = {};
  const currentMonthKey = format(now, "yyyy-MM");
  for (const s of scoresForBestMonth ?? []) {
    const monthKey = format(new Date(s.created_at), "yyyy-MM");
    if (monthKey === currentMonthKey) continue; // Exclude ongoing month
    const delta = s.source_type === "fine" ? -s.score_delta : s.score_delta;
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] ?? 0) + delta;
  }
  const bestMonthEntry = Object.entries(monthlyTotals).sort(([, a], [, b]) => b - a)[0];
  const bestMonth = bestMonthEntry
    ? { month: bestMonthEntry[0], score: bestMonthEntry[1] }
    : null;

  // Longest streak member
  let longestStreakMember: { name: string; longest_streak: number } | null = null;
  for (const m of members ?? []) {
    const s = streakMap[m.id]?.longest_streak ?? 0;
    if (s > (longestStreakMember?.longest_streak ?? 0)) {
      longestStreakMember = { name: m.name, longest_streak: s };
    }
  }

  const prevMonthScore = prevMonthWinnerId ? prevMonthByMember[prevMonthWinnerId] ?? 0 : 0;

  // Birthday: members with birthday today + award 10pt bonus if not yet given
  const todayForBirthday = new Date();
  const todayMonth = todayForBirthday.getMonth() + 1;
  const todayDay = todayForBirthday.getDate();
  const birthdayMembersToday = (members ?? []).filter((m) => {
    const b = (m as { birthday?: string | null }).birthday;
    if (!b || typeof b !== "string") return false;
    const [y, mo, d] = b.split("-").map(Number);
    return mo === todayMonth && d === todayDay;
  });
  if (birthdayMembersToday.length > 0) {
    const todayStart = new Date(todayForBirthday.getFullYear(), todayForBirthday.getMonth(), todayForBirthday.getDate()).toISOString();
    const todayEnd = new Date(todayForBirthday.getFullYear(), todayForBirthday.getMonth(), todayForBirthday.getDate() + 1).toISOString();
    const { data: existingBonuses } = await supabase
      .from("scores_log")
      .select("member_id")
      .eq("source_type", "birthday_bonus")
      .gte("created_at", todayStart)
      .lt("created_at", todayEnd);
    const alreadyAwarded = new Set((existingBonuses ?? []).map((r) => r.member_id));
    for (const m of birthdayMembersToday) {
      if (!alreadyAwarded.has(m.id)) {
        await supabase.from("scores_log").insert({
          member_id: m.id,
          source_type: "birthday_bonus",
          source_id: null,
          score_delta: 10,
          description: `Happy Birthday ${m.name}! 🎂`,
        });
      }
    }
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

  const isTaskRelevantToday = (t: { recurring_daily?: boolean; scheduled_days?: (number | string)[] | null }) =>
    (t.recurring_daily === true) ||
    isScheduledForDay(t.scheduled_days, dayOfWeek);

  const todayForDismissals = format(today, "yyyy-MM-dd");
  const { data: dismissalsRaw } = await supabase
    .from("activity_dismissals")
    .select("source_type, source_id")
    .eq("family_id", familyId)
    .eq("date", todayForDismissals);
  const dismissedSet = new Set(
    (dismissalsRaw ?? []).map((d) => `${d.source_type}:${d.source_id}`)
  );

  const openTasks = (openTasksRaw ?? [])
    .filter(isTaskRelevantToday)
    .filter((t) => !dismissedSet.has(`house:${t.id}`))
    .sort((a, b) => {
      const aWeekly = (a.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
      const bWeekly = (b.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
      if (bWeekly !== aWeekly) return bWeekly - aWeekly;
      const da = a.deadline ?? "9999-12-31";
      const db = b.deadline ?? "9999-12-31";
      return da.localeCompare(db);
    });

  const { data: sportActivitiesRaw } = await supabase
    .from("sport_activities")
    .select("*")
    .is("completed_at", null)
    .or(memberIds.length > 0 ? `member_id.in.(${memberIds.join(",")}),member_id.is.null` : "member_id.is.null");

  const sportActivities = (sportActivitiesRaw ?? [])
    .filter((a) => isScheduledForDay(a.scheduled_days, dayOfWeek))
    .filter((a) => !dismissedSet.has(`sport:${a.id}`))
    .sort((a, b) => {
      const aWeekly = a.type === "weekly" || (a.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
      const bWeekly = b.type === "weekly" || (b.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
      if (bWeekly !== aWeekly) return bWeekly - aWeekly;
      if (a.type === "extra" && b.type !== "extra") return 1;
      if (a.type !== "extra" && b.type === "extra") return -1;
      const dayA = (a.scheduled_days?.[0] ?? 7) as number;
      const dayB = (b.scheduled_days?.[0] ?? 7) as number;
      return dayA - dayB;
    });

  const { data: schoolTasksRaw } = await supabase
    .from("school_tasks")
    .select("*")
    .is("completed_at", null)
    .or(`due_date.gte.${todayStr},due_date.is.null`)
    .order("due_date", { ascending: true });

  const schoolTasks = (schoolTasksRaw ?? [])
    .filter((t) => isScheduledForDay(t.scheduled_days, dayOfWeek))
    .filter((t) => !dismissedSet.has(`school:${t.id}`))
    .sort((a, b) => {
    const aWeekly = (a.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
    const bWeekly = (b.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
    if (bWeekly !== aWeekly) return bWeekly - aWeekly;
    return (a.due_date ?? "").localeCompare(b.due_date ?? "");
  });

  const takenTasksMapped = (takenAssignments ?? [])
    .map((a) => {
      const t = (a as { tasks: unknown }).tasks;
      if (!t || typeof t !== "object" || !("family_id" in t)) return null;
      if ((t as { family_id: string }).family_id !== familyId) return null;
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

  const takenTasks = takenTasksMapped.sort((a, b) => {
    const aWeekly = (a.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
    const bWeekly = (b.scheduled_days?.length ?? 0) > 0 ? 1 : 0;
    if (bWeekly !== aWeekly) return bWeekly - aWeekly;
    const da = a.deadline ?? "9999-12-31";
    const db = b.deadline ?? "9999-12-31";
    return da.localeCompare(db);
  });

  // Activity log: fetch last 30 days so client can filter by selected range
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const { data: activityScores } = await supabase
    .from("scores_log")
    .select("id, member_id, source_type, source_id, score_delta, description, created_at")
    .in("member_id", (members ?? []).map((m) => m.id))
    .gte("created_at", thirtyDaysAgo)
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
        : s.source_type === "birthday_bonus"
          ? (s as { description?: string | null }).description || "Birthday bonus 🎂"
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
      source_type: s.source_type as "house" | "sport" | "school" | "streak_bonus" | "bonus" | "fine" | "birthday_bonus",
      source_id: s.source_id,
      title,
      score_delta: s.source_type === "fine" ? -s.score_delta : s.score_delta,
      created_at: s.created_at,
    };
  });

  const totalMonthlyScore = Object.values(monthlyByMember).reduce((sum, n) => sum + n, 0);

  return (
    <div className="min-w-0 space-y-6">
      <RealtimeLeaderboard />

      {/* Page header + Feeling Lucky - above leaderboard */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DashboardHeader
          defaultHeader={
            family?.dashboard_header && String(family.dashboard_header).trim()
              ? String(family.dashboard_header).trim()
              : family?.name
                ? `${family.name} Family Dashboard`
                : "Family Dashboard"
          }
          birthdayMembers={birthdayMembersToday.map((m) => ({ name: m.name }))}
        />
        <FeelingLuckyButton
          className="w-full shrink-0 sm:w-auto"
          activities={[
            ...openTasks.map((t) => ({ type: "house" as const, id: t.id, title: t.title, score_value: t.score_value })),
            ...sportActivities.filter((a) => !a.member_id).map((a) => ({ type: "sport" as const, id: a.id, title: a.title, score_value: a.score_value })),
            ...schoolTasks.filter((t) => !t.member_id).map((t) => ({ type: "school" as const, id: t.id, title: t.title, score_value: t.score_value })),
          ]}
        />
      </div>

      {/* Leaderboard + Statistics row - sticky on mobile */}
      <div className="sticky top-[5rem] z-40 -mx-4 space-y-4 px-4 sm:top-20 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <div className="shrink-0 lg:w-2/3">
              <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-slate-500 lg:text-left">
                Leaderboard
              </h2>
              <PodiumLeaderboard
                members={membersWithStreak}
                monthlyScores={monthlyByMember}
                prevMonthScores={prevMonthByMember}
                currentMonthDaysElapsed={getDate(now)}
                prevMonthDaysTotal={getDaysInMonth(prevMonthStart)}
              />
            </div>
            <div className="flex-1 lg:border-l lg:border-slate-200/60 lg:pl-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Statistics</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-slate-500">Monthly score</p>
                  <p className="text-lg font-bold text-blue-600">{totalMonthlyScore} pts</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Days left</p>
                  <p className="text-lg font-bold text-blue-600">{daysToEndOfMonth} day{daysToEndOfMonth !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Best day</p>
                  <p className="text-lg font-bold text-emerald-600">{bestDay ? `${bestDay.score} pts` : "—"}</p>
                  {bestDay && <p className="text-xs text-slate-500">{format(new Date(bestDay.date), "EEE MMM d")}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Best month</p>
                  <p className="text-lg font-bold text-emerald-600">{bestMonth ? `${bestMonth.score} pts` : "—"}</p>
                  {bestMonth && <p className="text-xs text-slate-500">{format(new Date(bestMonth.month + "-01"), "MMM yyyy")}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Prev month winner</p>
                  <p className="text-lg font-bold text-amber-600">{prevMonthWinner ? prevMonthWinner.name : "—"}</p>
                  {prevMonthWinner && <p className="text-xs text-slate-500">{format(prevMonthStart, "MMM yyyy")} · {prevMonthScore} pts</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Longest streak</p>
                  <p className="text-lg font-bold text-orange-600">{longestStreakMember ? `${longestStreakMember.longest_streak} days` : "0 days"}</p>
                  {longestStreakMember && <p className="text-xs text-slate-500">{longestStreakMember.name}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CommunityJar
          currentPoints={totalMonthlyScore}
          target={family?.jar_target ?? 1500}
          prize={family?.jar_prize ?? "1,500 points = Family Movie Night 🍿"}
        />
      </div>

      <DashboardTodayActivities
        takenTasks={takenTasks}
        openTasks={openTasks}
        sportActivities={sportActivities}
        schoolTasks={schoolTasks}
        members={members ?? []}
        showRemoveFromToday={family?.show_remove_from_today ?? false}
      />

      {/* Last Activities - bottom horizontal panel */}
      <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Calendar className="h-4 w-4 text-blue-500" />
          Last Activities
        </h2>
        <ActivityLog
          entries={activityEntries}
          members={members ?? []}
          showResetButton={family?.show_reset_button ?? false}
          horizontal
        />
      </div>
    </div>
  );
}
