"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetActivity } from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";
import { MemberAvatarPicker } from "@/components/MemberAvatarPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RotateCcw, Filter } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";

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
  avatar_url?: string | null;
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

const DAY_OPTIONS = [1, 2, 3, 5, 7, 14, 30] as const;

export function ActivityLog({ entries, members, showResetButton = false }: ActivityLogProps) {
  const router = useRouter();
  const [days, setDays] = useState(1);
  const [filterMemberId, setFilterMemberId] = useState<string>("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_ROWS = 8;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const entriesInRange = entries.filter((e) => new Date(e.created_at) >= cutoff);
  const filteredEntries =
    filterMemberId === ""
      ? entriesInRange
      : entriesInRange.filter((e) => e.member_id === filterMemberId);
  const displayedEntries = showAll ? filteredEntries : filteredEntries.slice(0, INITIAL_ROWS);
  const hasMore = filteredEntries.length > INITIAL_ROWS;

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
      <p className="text-sm text-slate-500">No activities yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              Last {d} day{d !== 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <Filter className="h-4 w-4 shrink-0 text-slate-400" />
        <MemberAvatarPicker
          members={members}
          value={filterMemberId}
          onChange={setFilterMemberId}
          size="sm"
          allowEmpty
          emptyLabel="All members"
        />
      </div>

      <ul className="space-y-3">
        {displayedEntries.map((entry) => (
          <li
            key={entry.id}
            className="relative ml-10 rounded-2xl rounded-bl-none bg-white/90 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:bg-slate-800/90"
          >
            <div className="absolute -left-10 top-2">
              <MemberAvatar
                name={entry.member_name}
                avatarUrl={entry.member_avatar_url}
                size="sm"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CategoryIcon type={entry.source_type} size="sm" />
                <span className="font-semibold">{entry.member_name}</span>
                <span className={`ml-auto shrink-0 text-sm font-bold ${entry.score_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {entry.score_delta >= 0 ? "+" : ""}{entry.score_delta}
                </span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-300">{entry.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {format(new Date(entry.created_at), "EEE MMM d · h:mm a")}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1">
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
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-slate-500"
        >
          Show more ({filteredEntries.length - INITIAL_ROWS} more)
        </Button>
      )}
      {filteredEntries.length === 0 && (
        <p className="text-sm text-slate-500">
          No activities in the last {days} day{days !== 1 ? "s" : ""}
          {filterMemberId ? " for this member" : ""}.
        </p>
      )}
    </div>
  );
}
