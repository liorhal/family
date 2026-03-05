"use client";

import { useRef, useState } from "react";
import { AVATAR_OPTIONS, isEmojiAvatar } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import { uploadAvatar } from "@/app/actions";
import { MemberAvatar } from "@/components/MemberAvatar";

interface AvatarPickerProps {
  name: string;
  value?: string | null;
  onChange: (value: string) => void;
  /** When editing, pass memberId for stable file path */
  memberId?: string | null;
}

export function AvatarPicker({ name, value, onChange, memberId }: AvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    if (memberId) formData.set("member_id", memberId);
    const res = await uploadAvatar(formData);
    setUploading(false);
    e.target.value = "";
    if (res.error) {
      setUploadError(res.error);
    } else if (res.url) {
      onChange(res.url);
    }
  }

  const hasPhoto = value && !isEmojiAvatar(value) && (value.startsWith("http") || value.startsWith("data:"));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Avatar</label>
      <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {uploading ? "Uploading…" : "Upload photo"}
          </button>
        </div>
      </div>
      {hasPhoto && (
        <div className="flex items-center gap-2">
          <MemberAvatar name="" avatarUrl={value} size="md" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-400"
          >
            Remove photo
          </button>
        </div>
      )}
      {uploadError && (
        <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
      )}
      <input type="hidden" name={name} value={value ?? ""} readOnly />
    </div>
  );
}
