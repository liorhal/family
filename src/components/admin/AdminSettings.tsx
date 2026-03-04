"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFamilySettings } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { AdminSection } from "./AdminSection";

interface AdminSettingsProps {
  showResetButton: boolean;
}

export function AdminSettings({ showResetButton }: AdminSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(showResetButton);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateFamilySettings(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      setShowReset(formData.get("show_reset_button") === "true");
      router.refresh();
    }
  }

  return (
    <AdminSection title="Settings" description="Family and display options">
      <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="show_reset_button" value={showReset ? "true" : "false"} />
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={showReset}
              onChange={(e) => setShowReset(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium">Show reset button in activity log</span>
          </label>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
    </AdminSection>
  );
}
