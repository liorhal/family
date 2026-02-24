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

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/admin");
  return { success: true, score: task.score_value };
}

/** Complete a sport activity */
export async function completeSportActivity(activityId: string) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("sport_activities")
    .select("id, member_id, score_value, completed_at")
    .eq("id", activityId)
    .single();

  if (!activity || activity.completed_at) {
    return { error: "Activity not found or already completed" };
  }

  // Verify activity belongs to family (member_id in family)
  const { data: activityMember } = await supabase
    .from("members")
    .select("id")
    .eq("id", activity.member_id)
    .eq("family_id", familyId)
    .single();
  if (!activityMember) return { error: "Unauthorized" };

  const now = new Date().toISOString();

  await supabase
    .from("sport_activities")
    .update({ completed_at: now })
    .eq("id", activityId);

  await supabase.from("scores_log").insert({
    member_id: activity.member_id,
    source_type: "sport",
    source_id: activityId,
    score_delta: activity.score_value,
  });

  await updateStreak(activity.member_id, familyId);

  revalidatePath("/");
  revalidatePath("/today");
  return { success: true, score: activity.score_value };
}

/** Complete a school task */
export async function completeSchoolTask(taskId: string) {
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

  // Verify task belongs to family (member_id in family)
  const { data: taskMember } = await supabase
    .from("members")
    .select("id")
    .eq("id", task.member_id)
    .eq("family_id", familyId)
    .single();
  if (!taskMember) return { error: "Unauthorized" };

  const now = new Date().toISOString();

  await supabase
    .from("school_tasks")
    .update({ completed_at: now })
    .eq("id", taskId);

  await supabase.from("scores_log").insert({
    member_id: task.member_id,
    source_type: "school",
    source_id: taskId,
    score_delta: task.score_value,
  });

  await updateStreak(task.member_id, familyId);

  revalidatePath("/");
  revalidatePath("/today");
  return { success: true, score: task.score_value };
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

  if (["streak_bonus", "bonus", "fine"].includes(sourceType)) {
    return { error: "Cannot reset bonus or fine entries" };
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
    const actMember = await supabase.from("members").select("family_id").eq("id", act.member_id).single();
    if (actMember.data?.family_id !== familyId) return { error: "Unauthorized" };
    await supabase.from("sport_activities").update({ completed_at: null }).eq("id", sourceId);
  } else if (sourceType === "school" && sourceId) {
    const { data: sch } = await supabase.from("school_tasks").select("id, member_id").eq("id", sourceId).single();
    if (!sch) return { error: "Task not found" };
    const schMember = await supabase.from("members").select("family_id").eq("id", sch.member_id).single();
    if (schMember.data?.family_id !== familyId) return { error: "Unauthorized" };
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

  const { error } = await supabase.from("members").insert({
    family_id: familyId,
    name,
    role,
    avatar_url: avatar_url || null,
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

  const { error } = await supabase
    .from("members")
    .update({ name, role, avatar_url: avatar_url || null })
    .eq("id", memberId)
    .eq("family_id", familyId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/today");
  return { success: true };
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

/** Create sport activity (admin for weekly, member for extra) */
export async function createSportActivity(formData: FormData) {
  const { member, familyId } = await getCurrentMember();
  if (!member || !familyId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const targetMemberId = formData.get("member_id") as string;
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
    isAdmin || (type === "extra" && targetMemberId === member.id);

  if (!canCreate) return { error: "Unauthorized" };

  const { error } = await supabase.from("sport_activities").insert({
    member_id: targetMemberId,
    title,
    type,
    scheduled_days: type === "weekly" ? scheduled_days : [],
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
  const targetMemberId = formData.get("member_id") as string;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "weekly" | "extra") || "extra";
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] = Array.isArray(scheduledDaysRaw)
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : [];
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);

  const { error } = await supabase
    .from("sport_activities")
    .update({
      member_id: targetMemberId,
      title,
      type,
      scheduled_days: type === "weekly" ? scheduled_days : [],
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
  const targetMemberId = (formData.get("member_id") as string) || member.id;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "homework" | "exam" | "project") || "homework";
  const due_date = formData.get("due_date") as string;
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] | null = Array.isArray(scheduledDaysRaw) && scheduledDaysRaw.length > 0
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : null;

  const isAdmin = member.role === "admin";
  if (targetMemberId !== member.id && !isAdmin) return { error: "Unauthorized" };

  const { error } = await supabase.from("school_tasks").insert({
    member_id: targetMemberId,
    title,
    type,
    due_date,
    scheduled_days,
    score_value,
  });

  if (error) return { error: error.message };
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
  const targetMemberId = formData.get("member_id") as string;
  const title = formData.get("title") as string;
  const type = (formData.get("type") as "homework" | "exam" | "project") || "homework";
  const due_date = formData.get("due_date") as string;
  const score_value = Math.max(0, parseInt(formData.get("score_value") as string) || 10);
  const scheduledDaysRaw = formData.getAll("scheduled_days");
  const scheduled_days: number[] | null = Array.isArray(scheduledDaysRaw) && scheduledDaysRaw.length > 0
    ? Array.from(new Set(scheduledDaysRaw.map((d) => Math.max(0, Math.min(6, parseInt(String(d))))).filter((d) => !isNaN(d))))
    : null;

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
