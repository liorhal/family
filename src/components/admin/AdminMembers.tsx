"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMember, updateMember } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "@/components/MemberAvatar";
import { AvatarPicker } from "./AvatarPicker";
import { AdminSection } from "./AdminSection";
import { Pencil } from "lucide-react";
import type { Member } from "@/lib/db/types";

interface AdminMembersProps {
  members: Member[];
}

export function AdminMembers({ members }: AdminMembersProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAvatar, setEditAvatar] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createMember(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      (e.target as HTMLFormElement).reset();
      setAvatar("");
      setShowCreateForm(false);
      router.refresh();
    }
  }

  async function handleEdit(memberId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateMember(memberId, formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      setEditingId(null);
      router.refresh();
    }
  }

  return (
    <AdminSection
      title="Family Members"
      description="Add new members. Select an avatar for each."
      createButtonLabel="Create new member"
      onCreateClick={() => setShowCreateForm(true)}
    >
      {showCreateForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Emma" required />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <option value="kid">Kid</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <AvatarPicker name="avatar_url" value={avatar} onChange={setAvatar} />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Member"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
          <p className="text-sm font-medium">Members</p>
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <form
                    onSubmit={(e) => handleEdit(m.id, e)}
                    className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label>Name</Label>
                        <Input name="name" defaultValue={m.name} required />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label>Role</Label>
                        <select
                          name="role"
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                          defaultValue={m.role}
                        >
                          <option value="kid">Kid</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <AvatarPicker name="avatar_url" value={editAvatar} onChange={setEditAvatar} />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>Save</Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
                    <MemberAvatar name={m.name} avatarUrl={m.avatar_url} size="sm" />
                    <span className="font-medium">{m.name}</span>
                    <Badge variant={m.role === "admin" ? "default" : "house"}>
                      {m.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditAvatar(m.avatar_url ?? "");
                      }}
                      title="Edit member"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    </AdminSection>
  );
}
