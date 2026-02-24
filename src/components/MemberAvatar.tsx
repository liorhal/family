"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isEmojiAvatar } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface MemberAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-base",
  md: "h-10 w-10 text-xl",
  lg: "h-12 w-12 text-2xl",
};

export function MemberAvatar({ name, avatarUrl, className, size = "md" }: MemberAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (avatarUrl && isEmojiAvatar(avatarUrl)) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700",
          sizeClass,
          className
        )}
        title={name}
      >
        {avatarUrl}
      </div>
    );
  }

  return (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarImage src={avatarUrl ?? undefined} />
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
