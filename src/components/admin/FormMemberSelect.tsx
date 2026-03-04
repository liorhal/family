"use client";

import { Label } from "@/components/ui/label";
import { MemberAvatarPicker } from "@/components/MemberAvatarPicker";

interface Member {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface FormMemberSelectProps {
  members: Member[];
  name: string;
  value: string;
  onChange: (id: string) => void;
  label: string;
}

export function FormMemberSelect({
  members,
  name,
  value,
  onChange,
  label,
}: FormMemberSelectProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="hidden" name={name} value={value} />
        <MemberAvatarPicker
          members={members}
          value={value}
          onChange={onChange}
          size="md"
          allowEmpty
        />
        <span className="text-sm text-slate-500">
          {value ? members.find((m) => m.id === value)?.name ?? "—" : "No default"}
        </span>
      </div>
    </div>
  );
}
