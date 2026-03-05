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
  source_type: "house" | "sport" | "school" | "streak_bonus" | "bonus" | "fine" | "birthday_bonus";
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
  horizontal?: boolean;
}

const sourceBadgeVariant: Record<ActivityEntry["source_type"], "house" | "sport" | "school" | "streak" | "fine"> = {
  house: "house",
  sport: "sport",
  school: "school",
  streak_bonus: "streak",
  bonus: "streak",
  fine: "fine",
  birthday_bonus: "streak",
};

/** Category border/accent colors for activity cards */
const sourceBorderColor: Record<ActivityEntry["source_type"], string> = {
  house: "border-l-green-500",
  sport: "border-l-orange-500",
  school: "border-l-purple-500",
  streak_bonus: "border-l-amber-500",
  bonus: "border-l-amber-500",
  fine: "border-l-red-500",
  birthday_bonus: "border-l-pink-500",
};

const DAY_OPTIONS = [1, 2, 3, 5, 7, 14, 30] as const;

export function ActivityLog({ entries, members, showResetButton = false, horizontal = false }: ActivityLogProps) {
  const router = useRouter();
  const [days, setDays] = useState(1);
  const [filterMemberId, setFilterMemberId] = useState<string>("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_ROWS = horizontal ? 50 : 8;

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
    if (entry.source_type === "streak_bonus" || entry.source_type === "birthday_bonus") return;
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

  const listContent = (
    <>
      {displayedEntries.map((entry) => (
        <li
          key={entry.id}
          className={
            horizontal
              ? `flex shrink-0 flex-col w-44 rounded-xl border-l-4 bg-white/90 p-2.5 shadow-md shadow-slate-200/40 backdrop-blur-sm dark:bg-slate-800/90 ${sourceBorderColor[entry.source_type]}`
              : `relative ml-9 rounded-xl rounded-bl-none border-l-4 bg-white/90 px-3 py-2 shadow-md shadow-slate-200/40 backdrop-blur-sm dark:bg-slate-800/90 ${sourceBorderColor[entry.source_type]}`
          }
        >
          {horizontal ? (
            <>
              <div className="flex items-center gap-2">
                <CategoryIcon type={entry.source_type} size="sm" />
                <MemberAvatar name={entry.member_name} avatarUrl={entry.member_avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{entry.member_name}</p>
                  <span className={`text-xs font-bold ${entry.score_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {entry.score_delta >= 0 ? "+" : ""}{entry.score_delta}
                  </span>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-700 dark:text-slate-300">{entry.title}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{format(new Date(entry.created_at), "EEE MMM d")}</p>
              {showResetButton && entry.source_type !== "streak_bonus" && entry.source_type !== "birthday_bonus" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-7 w-7 text-slate-500 hover:text-amber-600"
                  onClick={() => handleReset(entry)}
                  disabled={resettingId === entry.id}
                  title="Reset"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="absolute -left-9 top-1.5">
                <MemberAvatar name={entry.member_name} avatarUrl={entry.member_avatar_url} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CategoryIcon type={entry.source_type} size="sm" />
                  <span className="text-sm font-semibold">{entry.member_name}</span>
                  <span className={`ml-auto shrink-0 text-xs font-bold ${entry.score_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {entry.score_delta >= 0 ? "+" : ""}{entry.score_delta}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-700 dark:text-slate-300">{entry.title}</p>
                <p className="text-[10px] text-slate-500">{format(new Date(entry.created_at), "EEE MMM d · h:mm a")}</p>
              </div>
              <div className="mt-1 flex items-center justify-end gap-0.5">
                {showResetButton && entry.source_type !== "streak_bonus" && entry.source_type !== "birthday_bonus" && (
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
            </>
          )}
        </li>
      ))}
    </>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
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

      <ul
        className={
          horizontal
            ? "flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-slate-300"
            : "space-y-2"
        }
      >
        {listContent}
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
