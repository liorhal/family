"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetActivity } from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RotateCcw, Filter } from "lucide-react";

export interface ActivityEntry {
  id: string;
  member_id: string;
  member_name: string;
  member_avatar_url: string | null;
  source_type: "house" | "sport" | "school" | "streak_bonus" | "bonus" | "fine";
  source_id: string | null;
  title: string;
  score_delta: number;
  created_at: string;
}

interface Member {
  id: string;
  name: string;
}

interface ActivityLogProps {
  entries: ActivityEntry[];
  members: Member[];
  showResetButton?: boolean;
}

const sourceBadgeVariant: Record<ActivityEntry["source_type"], "house" | "sport" | "school" | "streak" | "fine"> = {
  house: "house",
  sport: "sport",
  school: "school",
  streak_bonus: "streak",
  bonus: "streak",
  fine: "fine",
};

export function ActivityLog({ entries, members, showResetButton = false }: ActivityLogProps) {
  const router = useRouter();
  const [filterMemberId, setFilterMemberId] = useState<string>("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  const filteredEntries =
    filterMemberId === ""
      ? entries
      : entries.filter((e) => e.member_id === filterMemberId);

  async function handleReset(entry: ActivityEntry) {
    if (entry.source_type === "streak_bonus") return;
    const msg = ["bonus", "fine"].includes(entry.source_type)
      ? `Remove this ${entry.source_type} entry?`
      : `Reset "${entry.title}"? This will undo the completion.`;
    if (!confirm(msg)) return;
    setResettingId(entry.id);
    const res = await resetActivity(entry.id, entry.source_type, entry.source_id);
    setResettingId(null);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">No completed activities in the last 7 days.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={filterMemberId}
          onChange={(e) => setFilterMemberId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {filteredEntries.map((entry) => (
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
                {entry.source_type === "house" ? "House" : entry.source_type === "sport" ? "Sport" : entry.source_type === "school" ? "School" : entry.source_type === "bonus" ? "Bonus" : entry.source_type === "fine" ? "Fine" : "Bonus"}
              </Badge>
              <span className={`text-sm font-medium ${entry.score_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {entry.score_delta >= 0 ? "+" : ""}{entry.score_delta}
              </span>
              {showResetButton && entry.source_type !== "streak_bonus" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-amber-600"
                  onClick={() => handleReset(entry)}
                  disabled={resettingId === entry.id}
                  title="Reset (undo completion)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {filteredEntries.length === 0 && (
        <p className="text-sm text-slate-500">No activities for this member.</p>
      )}
    </div>
  );
}
