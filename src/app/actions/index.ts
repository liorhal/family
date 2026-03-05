"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Get current user's member record and family */
async function getCurrentMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, member: null, familyId: null };

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return {
    user,
    member,
    familyId: member?.family_id ?? null,
  };
}

/** Create a house task (admin only) */
export async function createTask(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const deadlineRaw = formData.get("deadline") as string;
  let deadline = deadlineRaw || null;
  const recurring_daily = formData.get("recurring_daily") === "on" || formData.get("recurring_daily") === "true";
  if (recurring_daily && !deadline) {
    deadline = new Date().toISOString().split("T")[0];
  }
  const default_assignee_id = (formData.get("default_assignee_id") as string) || null;
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] | null = Array.isArray(scheduledDaysRaw) && scheduledDaysRaw.length > 0
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : null;

  const { error } = await supabase.from("tasks").insert({
    family_id: familyId,
    title,
    description,
    deadline,
    recurring_daily,
    scheduled_days,
    default_assignee_id: default_assignee_id || null,
    status: "open",
    score_value,
    created_by: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Update a house task (admin only) */
export async function updateTask(taskId: string, formData: FormData) {
  if (!taskId) return { error: "Invalid task" };
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const deadlineRaw = (formData.get("deadline") as string)?.trim() || "";
  let deadline: string | null = deadlineRaw || null;
  const recurring_daily = formData.get("recurring_daily") === "on" || formData.get("recurring_daily") === "true";
  if (recurring_daily && !deadline) {
    deadline = new Date().toISOString().split("T")[0];
  }
  const default_assignee_id = (formData.get("default_assignee_id") as string) || null;
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] | null = Array.isArray(scheduledDaysRaw) && scheduledDaysRaw.length > 0
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      deadline,
      recurring_daily,
      scheduled_days,
      default_assignee_id: default_assignee_id || null,
      score_value,
    })
    .eq("id", taskId)
    .eq("family_id", familyId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Delete a house task (admin only) */
export async function deleteTask(taskId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("family_id", familyId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Take an open task – assign to a family member */
export async function takeTask(taskId: string, assigneeId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  // Verify assignee is in family
  const { data: assignee } = await supabase
    .from("members")
    .select("id")
    .eq("id", assigneeId)
    .eq("family_id", familyId)
    .single();
  if (!assignee) return { error: "Invalid assignee" };

  // Verify task exists, is open, and belongs to family
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, status, family_id")
    .eq("id", taskId)
    .single();

  if (taskError || !task || task.family_id !== familyId || task.status !== "open") {
    return { error: "Task not available" };
  }

  const { error: assignError } = await supabase.from("task_assignments").insert({
    task_id: taskId,
    member_id: assigneeId,
  });

  if (assignError) {
    if (assignError.code === "23505") return { error: "Task already taken" };
    return { error: assignError.message };
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ status: "taken" })
    .eq("id", taskId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/");
  revalidatePath("/today");
  return { success: true };
}

/** Release a taken task (put back to open) */
export async function releaseTask(taskId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, family_id")
    .eq("id", taskId)
    .single();

  if (!task || task.family_id !== familyId || task.status !== "taken") {
    return { error: "Task not available" };
  }

  await supabase.from("task_assignments").delete().eq("task_id", taskId);
  await supabase.from("tasks").update({ status: "open" }).eq("id", taskId);

  revalidatePath("/");
  revalidatePath("/today");
  return { success: true };
}

/** Take an open task and complete it in one action (assign + complete) */
export async function takeAndCompleteTask(taskId: string, assigneeId: string) {
  const takeRes = await takeTask(taskId, assigneeId);
  if (takeRes.error) return takeRes;
  return completeTask(taskId);
}

/** Complete a task and award score */
export async function completeTask(taskId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("task_assignments")
    .select("id, member_id, completed_at")
    .eq("task_id", taskId)
    .single();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, score_value, deadline, status, recurring_daily")
    .eq("id", taskId)
    .single();

  if (!assignment || !task || task.status === "expired") {
    return { error: "Task not found or expired" };
  }

  if (task.status === "completed") {
    return { error: "Task already completed" };
  }

  const assignmentData = assignment;
  if (assignmentData.completed_at) {
    return { error: "Task already completed" };
  }

  const now = new Date().toISOString();
  const targetMemberId = assignmentData.member_id;

  // 1. Mark assignment complete
  await supabase
    .from("task_assignments")
    .update({ completed_at: now })
    .eq("task_id", taskId);

  // 2. If recurring_daily: reset task for tomorrow. Else: mark as completed.
  if (task.recurring_daily) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    await supabase
      .from("tasks")
      .update({ status: "open", deadline: tomorrowDate })
      .eq("id", taskId);
    await supabase.from("task_assignments").delete().eq("task_id", taskId);
  } else {
    await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId);
  }

  // 3. Log score
  await supabase.from("scores_log").insert({
    member_id: targetMemberId,
    source_type: "house",
    source_id: taskId,
    score_delta: task.score_value,
  });

  // 4. Update streak
  await updateStreak(targetMemberId, familyId);

  const newlyEarnedBadges = await getNewlyEarnedBadges(targetMemberId);
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/admin");
  return { success: true, score: task.score_value, newlyEarnedBadges };
}

/** Complete a sport activity. When activity has no member_id, completingMemberId is required. */
export async function completeSportActivity(activityId: string, completingMemberId?: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("sport_activities")
    .select("id, member_id, score_value, completed_at, type, scheduled_days")
    .eq("id", activityId)
    .single();

  if (!activity) return { error: "Activity not found" };

  // Extra activities with no weekly schedule can be completed multiple times per day
  const isAlwaysAvailable =
    activity.type === "extra" && (!activity.scheduled_days || activity.scheduled_days.length === 0);
  if (!isAlwaysAvailable && activity.completed_at) {
    return { error: "Activity already completed" };
  }

  let targetMemberId: string;
  if (activity.member_id) {
    const { data: activityMember } = await supabase
      .from("members")
      .select("id")
      .eq("id", activity.member_id)
      .eq("family_id", familyId)
      .single();
    if (!activityMember) return { error: "Unauthorized" };
    targetMemberId = activity.member_id;
  } else {
    if (!completingMemberId) return { error: "Select who completes this activity" };
    const { data: completingMember } = await supabase
      .from("members")
      .select("id")
      .eq("id", completingMemberId)
      .eq("family_id", familyId)
      .single();
    if (!completingMember) return { error: "Invalid member" };
    targetMemberId = completingMemberId;
  }

  const now = new Date().toISOString();

  // Only set completed_at for scheduled activities; always-available extras stay open for repeat completions
  if (!isAlwaysAvailable) {
    await supabase
      .from("sport_activities")
      .update({ completed_at: now })
      .eq("id", activityId);
  }

  await supabase.from("scores_log").insert({
    member_id: targetMemberId,
    source_type: "sport",
    source_id: activityId,
    score_delta: activity.score_value,
  });

  await updateStreak(targetMemberId, familyId);

  const newlyEarnedBadges = await getNewlyEarnedBadges(targetMemberId);
  revalidatePath("/");
  revalidatePath("/today");
  return { success: true, score: activity.score_value, newlyEarnedBadges };
}

/** Complete a school task. When task has no member_id (research), completingMemberId is required. */
export async function completeSchoolTask(taskId: string, completingMemberId?: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { data: task } = await supabase
    .from("school_tasks")
    .select("id, member_id, score_value, completed_at")
    .eq("id", taskId)
    .single();

  if (!task || task.completed_at) {
    return { error: "Task not found or already completed" };
  }

  let targetMemberId: string;
  if (task.member_id) {
    const { data: taskMember } = await supabase
      .from("members")
      .select("id")
      .eq("id", task.member_id)
      .eq("family_id", familyId)
      .single();
    if (!taskMember) return { error: "Unauthorized" };
    targetMemberId = task.member_id;
  } else {
    if (!completingMemberId) return { error: "Select who completes this activity" };
    const { data: completingMember } = await supabase
      .from("members")
      .select("id")
      .eq("id", completingMemberId)
      .eq("family_id", familyId)
      .single();
    if (!completingMember) return { error: "Invalid member" };
    targetMemberId = completingMemberId;
  }

  const now = new Date().toISOString();

  await supabase
    .from("school_tasks")
    .update({ completed_at: now })
    .eq("id", taskId);

  await supabase.from("scores_log").insert({
    member_id: targetMemberId,
    source_type: "school",
    source_id: taskId,
    score_delta: task.score_value,
  });

  await updateStreak(targetMemberId, familyId);

  const newlyEarnedBadges = await getNewlyEarnedBadges(targetMemberId);
  revalidatePath("/");
  revalidatePath("/today");
  return { success: true, score: task.score_value, newlyEarnedBadges };
}

/** Reset (undo) a completed activity - removes score and marks source as incomplete */
export async function resetActivity(scoreLogId: string, sourceType: string, sourceId: string | null) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { data: scoreRow } = await supabase
    .from("scores_log")
    .select("id, member_id, source_type, source_id")
    .eq("id", scoreLogId)
    .single();

  if (!scoreRow) return { error: "Score not found" };

  const { data: scoreMember } = await supabase
    .from("members")
    .select("family_id")
    .eq("id", scoreRow.member_id)
    .single();
  if (!scoreMember || scoreMember.family_id !== familyId) return { error: "Unauthorized" };

  if (scoreRow.source_type !== sourceType || scoreRow.source_id !== sourceId) {
    return { error: "Mismatch" };
  }

  if (sourceType === "streak_bonus") {
    return { error: "Cannot reset streak bonus" };
  }

  if (sourceType === "house" && sourceId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("id, recurring_daily, status, family_id")
      .eq("id", sourceId)
      .single();
    if (!task || (task as { family_id: string }).family_id !== familyId) return { error: "Task not found" };

    if (!task.recurring_daily) {
      await supabase.from("task_assignments").update({ completed_at: null }).eq("task_id", sourceId);
      await supabase.from("tasks").update({ status: "taken" }).eq("id", sourceId);
    }
  } else if (sourceType === "sport" && sourceId) {
    const { data: act } = await supabase.from("sport_activities").select("id, member_id").eq("id", sourceId).single();
    if (!act) return { error: "Activity not found" };
    if (act.member_id) {
      const { data: actMember } = await supabase.from("members").select("family_id").eq("id", act.member_id).single();
      if (actMember?.family_id !== familyId) return { error: "Unauthorized" };
    }
    await supabase.from("sport_activities").update({ completed_at: null }).eq("id", sourceId);
  } else if (sourceType === "school" && sourceId) {
    const { data: sch } = await supabase.from("school_tasks").select("id, member_id, family_id").eq("id", sourceId).single();
    if (!sch) return { error: "Task not found" };
    if (sch.member_id) {
      const { data: schMember } = await supabase.from("members").select("family_id").eq("id", sch.member_id).single();
      if (schMember?.family_id !== familyId) return { error: "Unauthorized" };
    } else if ((sch as { family_id?: string }).family_id !== familyId) {
      return { error: "Unauthorized" };
    }
    await supabase.from("school_tasks").update({ completed_at: null }).eq("id", sourceId);
  }

  const { error } = await supabase.from("scores_log").delete().eq("id", scoreLogId);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/today");
  return { success: true };
}

/** Update streak for a member after activity */
async function updateStreak(memberId: string, familyId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("member_id", memberId)
    .single();

  let current_streak = 0;
  let longest_streak = streak?.longest_streak ?? 0;
  const lastDate = streak?.last_activity_date;

  if (!lastDate) {
    current_streak = 1;
  } else {
    const last = new Date(lastDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      current_streak = streak?.current_streak ?? 0;
    } else if (diffDays === 1) {
      current_streak = (streak?.current_streak ?? 0) + 1;
    } else {
      current_streak = 1;
    }
  }

  longest_streak = Math.max(longest_streak, current_streak);

  // Streak bonus: 7-day streak = 10 extra points
  if (current_streak > 0 && current_streak % 7 === 0 && lastDate !== today) {
    await supabase.from("scores_log").insert({
      member_id: memberId,
      source_type: "streak_bonus",
      source_id: null,
      score_delta: 10,
    });
  }

  await supabase.from("streaks").upsert(
    {
      member_id: memberId,
      current_streak,
      longest_streak,
      last_activity_date: today,
    },
    { onConflict: "member_id" }
  );
}

/** Calculate monthly scores for a member */
export async function calculateMonthlyScores(memberId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data } = await supabase
    .from("scores_log")
    .select("source_type, score_delta")
    .eq("member_id", memberId)
    .gte("created_at", monthStart.toISOString());

  const monthly = (data ?? []).reduce(
    (sum, r) => sum + (r.source_type === "fine" ? -r.score_delta : r.score_delta),
    0
  );
  return monthly;
}

export interface BadgeProgress {
  badgeId: string;
  type: "general_streak" | "sports_streak" | "master_of_task";
  title: string;
  description: string;
  current: number;
  threshold: number;
  earned: boolean;
  taskTitle?: string;
  /** ISO date when badge was earned (from badge_earnings) */
  earnedAt?: string;
}

interface RawBadgeProgress {
  badgeId: string;
  type: "general_streak" | "sports_streak" | "master_of_task";
  title: string;
  description: string;
  rawCurrent: number;
  threshold: number;
  earned: boolean;
  taskTitle?: string;
}

/** Internal: compute badge progress with raw (uncapped) current for "just earned" detection */
async function getBadgeProgressRaw(memberId: string): Promise<RawBadgeProgress[] | null> {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return null;

  const supabase = await createClient();
  const { data: memberData } = await supabase
    .from("members")
    .select("family_id")
    .eq("id", memberId)
    .single();
  if (!memberData || memberData.family_id !== familyId) return null;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: streak } = await supabase
    .from("streaks")
    .select("longest_streak")
    .eq("member_id", memberId)
    .single();
  const generalStreak = streak?.longest_streak ?? 0;

  const { data: sportScores } = await supabase
    .from("scores_log")
    .select("created_at")
    .eq("member_id", memberId)
    .eq("source_type", "sport")
    .gte("created_at", oneYearAgo.toISOString());
  const sportDates = new Set(
    (sportScores ?? []).map((s) => new Date(s.created_at).toISOString().split("T")[0])
  );
  const sportDatesSorted = Array.from(sportDates).sort();
  let sportsStreak = sportDatesSorted.length > 0 ? 1 : 0;
  if (sportDatesSorted.length > 1) {
    let run = 1;
    for (let i = 1; i < sportDatesSorted.length; i++) {
      const prev = new Date(sportDatesSorted[i - 1]).getTime();
      const curr = new Date(sportDatesSorted[i]).getTime();
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) run++;
      else {
        sportsStreak = Math.max(sportsStreak, run);
        run = 1;
      }
    }
    sportsStreak = Math.max(sportsStreak, run);
  }

  const { data: houseScores } = await supabase
    .from("scores_log")
    .select("source_id")
    .eq("member_id", memberId)
    .eq("source_type", "house")
    .not("source_id", "is", null);
  const taskCounts: Record<string, number> = {};
  for (const s of houseScores ?? []) {
    const tid = s.source_id as string;
    taskCounts[tid] = (taskCounts[tid] ?? 0) + 1;
  }

  const { data: familyTasks } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("family_id", familyId);

  const { GENERAL_STREAK_BADGES, SPORTS_STREAK_BADGES, getMasterOfTaskBadge, MASTER_THRESHOLDS } = await import(
    "@/lib/badges"
  );

  const result: RawBadgeProgress[] = [];
  for (const b of GENERAL_STREAK_BADGES) {
    result.push({
      badgeId: b.id,
      type: "general_streak",
      title: b.title,
      description: b.description,
      rawCurrent: generalStreak,
      threshold: b.threshold,
      earned: generalStreak >= b.threshold,
    });
  }
  for (const b of SPORTS_STREAK_BADGES) {
    result.push({
      badgeId: b.id,
      type: "sports_streak",
      title: b.title,
      description: b.description,
      rawCurrent: sportsStreak,
      threshold: b.threshold,
      earned: sportsStreak >= b.threshold,
    });
  }
  for (const task of familyTasks ?? []) {
    const count = taskCounts[task.id] ?? 0;
    for (const th of MASTER_THRESHOLDS) {
      const badge = getMasterOfTaskBadge(task.title, th, task.id);
      result.push({
        badgeId: badge.id,
        type: "master_of_task",
        title: badge.title,
        description: badge.description,
        rawCurrent: count,
        threshold: th,
        earned: count >= th,
        taskTitle: task.title,
      });
    }
  }
  return result;
}

/** Get badge progress for a family member (capped display, no "7 of 5") */
export async function getBadgeProgress(memberId: string): Promise<{ error?: string; data?: BadgeProgress[] }> {
  const raw = await getBadgeProgressRaw(memberId);
  if (!raw) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data: earnings } = await supabase
    .from("badge_earnings")
    .select("badge_id, earned_at")
    .eq("member_id", memberId);
  const earnedAtMap = new Map<string, string>(
    (earnings ?? []).map((e) => [e.badge_id, e.earned_at])
  );

  const result: BadgeProgress[] = raw.map((p) => ({
    badgeId: p.badgeId,
    type: p.type,
    title: p.title,
    description: p.description,
    current: p.earned ? Math.min(p.rawCurrent, p.threshold) : p.rawCurrent,
    threshold: p.threshold,
    earned: p.earned,
    taskTitle: p.taskTitle,
    earnedAt: earnedAtMap.get(p.badgeId),
  }));

  return { data: result };
}

/** Returns badges just earned (rawCurrent === threshold). Records in badge_earnings, awards 5pt for master_of_task only. */
async function getNewlyEarnedBadges(memberId: string): Promise<{ title: string }[]> {
  const raw = await getBadgeProgressRaw(memberId);
  if (!raw) return [];

  const supabase = await createClient();

  // Newly earned = exactly at threshold this completion (avoids "7 of 5" false positives)
  const newlyEarned = raw.filter((p) => p.earned && p.rawCurrent === p.threshold);
  if (newlyEarned.length === 0) return [];

  const now = new Date().toISOString();

  for (const p of newlyEarned) {
    await supabase.from("badge_earnings").upsert(
      { member_id: memberId, badge_id: p.badgeId, earned_at: now },
      { onConflict: "member_id,badge_id" }
    );
    // 5pt bonus for master_of_task only (avoid double reward with 7/14/21 streak bonus)
    if (p.type === "master_of_task") {
      await supabase.from("scores_log").insert({
        member_id: memberId,
        source_type: "bonus",
        source_id: null,
        score_delta: 5,
        description: `Badge: ${p.title}`,
      });
    }
  }

  return newlyEarned.map((p) => ({ title: p.title }));
}

export interface FamilyBadgeEntry extends BadgeProgress {
  memberId: string;
  memberName: string;
  memberAvatarUrl: string | null;
}

/** Get top badge progress across entire family (for default badges view) */
export async function getFamilyBadgeProgress(): Promise<{ error?: string; data?: FamilyBadgeEntry[] }> {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, name, avatar_url")
    .eq("family_id", familyId);
  if (!members?.length) return { data: [] };

  const entries: FamilyBadgeEntry[] = [];
  for (const m of members) {
    const res = await getBadgeProgress(m.id);
    if (res.data) {
      for (const p of res.data) {
        entries.push({
          ...p,
          memberId: m.id,
          memberName: m.name,
          memberAvatarUrl: m.avatar_url ?? null,
        });
      }
    }
  }

  // Sort: earned first, then by completion ratio (highest first), then by threshold (higher = more impressive)
  entries.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    const ratioA = a.threshold > 0 ? a.current / a.threshold : 0;
    const ratioB = b.threshold > 0 ? b.current / b.threshold : 0;
    if (Math.abs(ratioB - ratioA) > 0.001) return ratioB - ratioA;
    return b.threshold - a.threshold;
  });

  return { data: entries };
}

/** Create member (admin) */
export async function createMember(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const name = formData.get("name") as string;
  const role = (formData.get("role") as "admin" | "kid") || "kid";
  const avatar_url = (formData.get("avatar_url") as string) || null;
  const birthdayRaw = (formData.get("birthday") as string)?.trim() || "";
  const birthday = birthdayRaw && /^\d{4}-\d{2}-\d{2}$/.test(birthdayRaw) ? birthdayRaw : null;

  const { error } = await supabase.from("members").insert({
    family_id: familyId,
    name,
    role,
    avatar_url: avatar_url || null,
    birthday,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Update member (admin) */
export async function updateMember(memberId: string, formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const name = formData.get("name") as string;
  const role = (formData.get("role") as "admin" | "kid") || "kid";
  const avatar_url = (formData.get("avatar_url") as string) || null;
  const birthdayRaw = (formData.get("birthday") as string)?.trim() || "";
  const birthday = birthdayRaw && /^\d{4}-\d{2}-\d{2}$/.test(birthdayRaw) ? birthdayRaw : null;

  const { error } = await supabase
    .from("members")
    .update({ name, role, avatar_url: avatar_url || null, birthday })
    .eq("id", memberId)
    .eq("family_id", familyId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Upload avatar photo using service role (bypasses RLS). User must be validated first. */
export async function uploadAvatar(formData: FormData): Promise<{ error?: string; url?: string }> {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return { error: "File too large. Max 2MB." };
  }
  if (!AVATAR_TYPES.includes(file.type)) {
    return { error: "Invalid format. Use JPEG, PNG, or WebP." };
  }

  const memberId = (formData.get("member_id") as string) || null;
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const safeExt = ["jpeg", "jpg", "png", "webp"].includes(ext) ? ext : "webp";
  const fileName = memberId ? `${memberId}.${safeExt}` : `${crypto.randomUUID()}.${safeExt}`;
  const path = `${familyId}/${fileName}`;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  if (!supabase) {
    return { error: "Avatar upload not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment." };
  }
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Add bonus or fine points for a member (admin only) */
export async function addBonusFine(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const targetMemberId = formData.get("member_id") as string;
  const type = (formData.get("type") as "bonus" | "fine") || "bonus";
  const points = Math.max(0, parseInt(formData.get("points") as string) || 0);
  const description = (formData.get("description") as string)?.trim() || null;

  if (points === 0) return { error: "Points must be greater than 0" };

  const { data: targetMember } = await supabase
    .from("members")
    .select("family_id")
    .eq("id", targetMemberId)
    .single();
  if (!targetMember || targetMember.family_id !== familyId) {
    return { error: "Member not found" };
  }

  const { error } = await supabase.from("scores_log").insert({
    member_id: targetMemberId,
    source_type: type,
    source_id: null,
    score_delta: points,
    description,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Update family settings (admin only) */
export async function updateFamilySettings(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const show_reset_button = formData.get("show_reset_button") === "true";
  const show_remove_from_today = formData.get("show_remove_from_today") === "true";
  const jar_target = Math.max(1, parseInt(String(formData.get("jar_target")), 10) || 1500);
  const jar_prize = (formData.get("jar_prize") as string)?.trim() || "1,500 points = Family Movie Night 🍿";
  const dashboard_header = (formData.get("dashboard_header") as string)?.trim() || null;

  const { error } = await supabase
    .from("families")
    .update({ show_reset_button, show_remove_from_today, jar_target, jar_prize, dashboard_header })
    .eq("id", familyId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Remove an activity from today's list. Reappears tomorrow. */
export async function dismissActivityFromToday(
  sourceType: "house" | "sport" | "school",
  sourceId: string
) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const today = new Date().toISOString().split("T")[0];
  const supabase = await createClient();
  const { error } = await supabase.from("activity_dismissals").insert({
    family_id: familyId,
    source_type: sourceType,
    source_id: sourceId,
    date: today,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/today");
  return { success: true };
}

/** Create sport activity (admin for weekly, member for extra) */
export async function createSportActivity(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const targetMemberId = (formData.get("member_id") as string)?.trim() || null;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "weekly" | "extra") || "extra";
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] = Array.isArray(scheduledDaysRaw)
    ? scheduledDaysRaw
        .map((d) => Math.max(0, Math.min(6, parseInt(String(d)))))
        .filter((d) => !isNaN(d))
        .filter((d, i, a) => a.indexOf(d) === i)
    : [];
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);

  const isAdmin = member.role === "admin";
  const canCreate =
    isAdmin || (type === "extra" && (targetMemberId === member.id || !targetMemberId));

  if (!canCreate) return { error: "Unauthorized" };

  if (targetMemberId) {
    const { data: targetMember } = await supabase
      .from("members")
      .select("family_id")
      .eq("id", targetMemberId)
      .single();
    if (!targetMember || targetMember.family_id !== familyId) return { error: "Invalid member" };
  }

  const { error } = await supabase.from("sport_activities").insert({
    member_id: targetMemberId || null,
    title,
    type,
    scheduled_days,
    score_value,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Update sport activity (admin only) */
export async function updateSportActivity(activityId: string, formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const targetMemberId = (formData.get("member_id") as string)?.trim() || null;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "weekly" | "extra") || "extra";
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] = Array.isArray(scheduledDaysRaw)
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : [];
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);

  if (targetMemberId) {
    const { data: targetMember } = await supabase
      .from("members")
      .select("family_id")
      .eq("id", targetMemberId)
      .single();
    if (!targetMember || targetMember.family_id !== familyId) return { error: "Invalid member" };
  }

  const { error } = await supabase
    .from("sport_activities")
    .update({
      member_id: targetMemberId || null,
      title,
      type,
      scheduled_days,
      score_value,
    })
    .eq("id", activityId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Delete sport activity (admin only) */
export async function deleteSportActivity(activityId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sport_activities")
    .delete()
    .eq("id", activityId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Create school task */
export async function createSchoolTask(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const memberIdRaw = formData.get("member_id") as string;
  const targetMemberId = memberIdRaw && memberIdRaw.trim() !== "" ? memberIdRaw : null;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "homework" | "exam" | "project" | "research") || "homework";
  const dueDateRaw = formData.get("due_date") as string;
  const due_date = dueDateRaw && dueDateRaw.trim() !== "" ? dueDateRaw : null;
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] | null = Array.isArray(scheduledDaysRaw) && scheduledDaysRaw.length > 0
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : null;

  const isAdmin = member.role === "admin";
  if (targetMemberId && targetMemberId !== member.id && !isAdmin) return { error: "Unauthorized" };
  if (targetMemberId) {
    const { data: m } = await supabase.from("members").select("id").eq("id", targetMemberId).eq("family_id", familyId).single();
    if (!m) return { error: "Invalid member" };
  }

  const { error } = await supabase.from("school_tasks").insert({
    member_id: targetMemberId,
    family_id: familyId,
    title,
    type,
    due_date,
    scheduled_days,
    score_value,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Update school task (admin only) */
export async function updateSchoolTask(taskId: string, formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const memberIdRaw = formData.get("member_id") as string;
  const targetMemberId = memberIdRaw && memberIdRaw.trim() !== "" ? memberIdRaw : null;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "homework" | "exam" | "project" | "research") || "homework";
  const dueDateRaw = formData.get("due_date") as string;
  const due_date = dueDateRaw && dueDateRaw.trim() !== "" ? dueDateRaw : null;
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] | null = Array.isArray(scheduledDaysRaw) && scheduledDaysRaw.length > 0
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : null;

  if (targetMemberId) {
    const { data: m } = await supabase.from("members").select("id").eq("id", targetMemberId).eq("family_id", familyId).single();
    if (!m) return { error: "Invalid member" };
  }

  const { error } = await supabase
    .from("school_tasks")
    .update({
      member_id: targetMemberId,
      title,
      type,
      due_date,
      scheduled_days,
      score_value,
    })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}

/** Delete school task (admin only) */
export async function deleteSchoolTask(taskId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId || member.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("school_tasks")
    .delete()
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
}
