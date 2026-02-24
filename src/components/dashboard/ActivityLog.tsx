import { MemberAvatar } from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface ActivityEntry {
  id: string;
  member_id: string;
  member_name: string;
  member_avatar_url: string | null;
  source_type: "house" | "sport" | "school" | "streak_bonus";
  title: string;
  score_delta: number;
  created_at: string;
}

interface ActivityLogProps {
  entries: ActivityEntry[];
}

const sourceBadgeVariant = {
  house: "house" as const,
  sport: "sport" as const,
  school: "school" as const,
  streak_bonus: "streak" as const,
};

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">No completed activities in the last 7 days.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
        >
          <MemberAvatar
            name={entry.member_name}
            avatarUrl={entry.member_avatar_url}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="font-medium">{entry.member_name}</span>
              {" completed "}
              <span className="text-slate-700 dark:text-slate-300">{entry.title}</span>
            </p>
            <p className="text-xs text-slate-500">
              {format(new Date(entry.created_at), "EEE MMM d · h:mm a")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={sourceBadgeVariant[entry.source_type]} className="text-xs">
              {entry.source_type === "house" ? "House" : entry.source_type === "sport" ? "Sport" : entry.source_type === "school" ? "School" : "Bonus"}
            </Badge>
            <span className="text-sm font-medium text-green-600">+{entry.score_delta}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
