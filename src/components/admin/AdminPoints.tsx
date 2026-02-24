"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBonusFine } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSection } from "./AdminSection";
import type { Member } from "@/lib/db/types";

interface AdminPointsProps {
  members: Member[];
}

export function AdminPoints({ members }: AdminPointsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addBonusFine(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      (e.target as HTMLFormElement).reset();
      setShowForm(false);
      router.refresh();
    }
  }

  return (
    <AdminSection
      title="Bonus & Fine Points"
      description="Add bonus or fine points for a specific member with a description."
      createButtonLabel="Add bonus/fine"
      onCreateClick={() => setShowForm(true)}
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="member_id">Member</Label>
              <select
                id="member_id"
                name="member_id"
                required
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="bonus">Bonus (+)</option>
                <option value="fine">Fine (−)</option>
              </select>
            </div>
            <div className="w-24 space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min={1}
                required
                placeholder="10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Helpful with chores"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </AdminSection>
  );
}
