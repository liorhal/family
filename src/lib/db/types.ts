export type MemberRole = "admin" | "kid";
export type TaskStatus = "open" | "taken" | "completed" | "expired";
export type SportType = "weekly" | "extra";
export type SchoolTaskType = "homework" | "exam" | "project";
export type ScoreSourceType = "house" | "sport" | "school" | "streak_bonus" | "bonus" | "fine";

export interface Family {
  id: string;
  name: string;
  show_reset_button: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  role: MemberRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  recurring_daily: boolean;
  scheduled_days: number[] | null;
  default_assignee_id: string | null;
  status: TaskStatus;
  score_value: number;
  created_by: string | null;
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  member_id: string;
  taken_at: string;
  completed_at: string | null;
}

export interface SportActivity {
  id: string;
  member_id: string;
  title: string;
  type: SportType;
  scheduled_days: number[];
  score_value: number;
  completed_at: string | null;
  created_at: string;
}

export interface SchoolTask {
  id: string;
  member_id: string;
  title: string;
  type: SchoolTaskType;
  due_date: string;
  scheduled_days: number[] | null;
  score_value: number;
  completed_at: string | null;
  created_at: string;
}

export interface ScoresLog {
  id: string;
  member_id: string;
  source_type: ScoreSourceType;
  source_id: string | null;
  score_delta: number;
  description: string | null;
  created_at: string;
}

export interface Streak {
  member_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface MemberWithStreak extends Member {
  current_streak?: number;
  longest_streak?: number;
  weekly_score?: number;
  monthly_score?: number;
}
