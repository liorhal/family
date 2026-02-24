"use client";

import { AVATAR_OPTIONS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  name: string;
  value?: string | null;
  onChange: (value: string) => void;
}

export function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Avatar</label>
      <div className="flex flex-wrap gap-2">
        {AVATAR_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl transition-colors",
              value === emoji
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
            )}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value ?? ""} readOnly />
    </div>
  );
}
