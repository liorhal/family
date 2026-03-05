"use client";

import { MemberAvatar } from "@/components/MemberAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";

interface Member {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface MemberAvatarPickerProps {
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
  size?: "sm" | "md";
  className?: string;
  allowEmpty?: boolean;
  /** Label for empty option when allowEmpty (e.g. "All members") */
  emptyLabel?: string;
}

export function MemberAvatarPicker({
  members,
  value,
  onChange,
  size = "sm",
  className,
  allowEmpty = false,
  emptyLabel = "No default",
}: MemberAvatarPickerProps) {
  const avatarSize = size === "sm" ? "sm" : "md";
  const triggerSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const selectedMember = members.find((m) => m.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={selectedMember ? selectedMember.name : "Select member"}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500",
            selectedMember && "border-solid border-blue-400 bg-white dark:border-blue-500 dark:bg-slate-900",
            triggerSize,
            className
          )}
        >
          {selectedMember ? (
            <MemberAvatar name={selectedMember.name} avatarUrl={selectedMember.avatar_url} size={avatarSize} />
          ) : (
            <UserPlus className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", "text-slate-400")} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem] p-1">
        {allowEmpty && (
          <DropdownMenuItem
            onSelect={() => onChange("")}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 focus:bg-slate-100 dark:focus:bg-slate-800",
              !value && "bg-slate-100 dark:bg-slate-800"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
              <UserPlus className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </span>
            <span className="text-slate-500">{emptyLabel}</span>
          </DropdownMenuItem>
        )}
        {members.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onSelect={() => onChange(m.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 focus:bg-slate-100 dark:focus:bg-slate-800",
              value === m.id && "bg-slate-100 dark:bg-slate-800"
            )}
          >
            <span className="shrink-0">
              <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size={avatarSize} />
            </span>
            <span className="truncate">{m.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
