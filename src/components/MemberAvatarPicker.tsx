"use client";

import { MemberAvatar } from "@/components/MemberAvatar";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface MemberAvatarPickerProps {
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
  /** Show placeholder for "no selection" - required for forms that need explicit selection */
  requireSelection?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function MemberAvatarPicker({
  members,
  value,
  onChange,
  requireSelection = false,
  size = "sm",
  className,
}: MemberAvatarPickerProps) {
  const btnSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const avatarSize = size === "sm" ? "sm" : "md";

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)} role="group" aria-label="Select member">
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          title={m.name}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-all ring-2 ring-transparent hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500",
            value === m.id ? "ring-blue-500 ring-offset-2 dark:ring-offset-slate-900" : "",
            btnSize
          )}
        >
          <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size={avatarSize} />
        </button>
      ))}
    </div>
  );
}
