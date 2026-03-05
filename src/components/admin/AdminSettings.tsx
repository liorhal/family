"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFamilySettings } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSection } from "./AdminSection";

interface AdminSettingsProps {
  showResetButton: boolean;
  showRemoveFromToday?: boolean;
  jarTarget?: number;
  jarPrize?: string;
  dashboardHeader?: string;
}

export function AdminSettings({ showResetButton, showRemoveFromToday: initialRemove = false, jarTarget = 1500, jarPrize = "1,500 points = Family Movie Night 🍿", dashboardHeader = "" }: AdminSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(showResetButton);
  const [showRemove, setShowRemove] = useState(initialRemove);
  const [target, setTarget] = useState(String(jarTarget));
  const [prize, setPrize] = useState(jarPrize);
  const [header, setHeader] = useState(dashboardHeader);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateFamilySettings(formData);
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      setShowReset(formData.get("show_reset_button") === "true");
      setShowRemove(formData.get("show_remove_from_today") === "true");
      setTarget(String(formData.get("jar_target") || 1500));
      setPrize((formData.get("jar_prize") as string) || "");
      setHeader((formData.get("dashboard_header") as string) || "");
      router.refresh();
    }
  }

  return (
    <AdminSection title="Settings" description="Family and display options">
      <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="show_reset_button" value={showReset ? "true" : "false"} />
          <input type="hidden" name="show_remove_from_today" value={showRemove ? "true" : "false"} />
          <div className="space-y-2">
            <Label htmlFor="dashboard_header">Dashboard header</Label>
            <Input
              id="dashboard_header"
              name="dashboard_header"
              placeholder="e.g. Smith Family Dashboard (leave empty for default)"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-slate-500">Default: &quot;[Family name] Family Dashboard&quot;</p>
          </div>
          <div className="space-y-2">
            <Label>Community Jar</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="jar_target" className="text-xs">Target points</Label>
                <Input
                  id="jar_target"
                  name="jar_target"
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="jar_prize" className="text-xs">Prize / milestone label</Label>
                <Input
                  id="jar_prize"
                  name="jar_prize"
                  placeholder="e.g. Family Movie Night 🍿"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                />
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={showReset}
              onChange={(e) => setShowReset(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium">Show reset button in activity log</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={showRemove}
              onChange={(e) => setShowRemove(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium">Allow removing activities from today (reappears tomorrow)</span>
          </label>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
    </AdminSection>
  );
}
