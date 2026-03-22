import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMonthSummary } from "@/app/actions";
import { MonthSummarySlideshow } from "@/components/dashboard/MonthSummarySlideshow";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function MonthlySummaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase.from("members").select("family_id").eq("user_id", user.id).single();
  if (!member) redirect("/onboarding");

  const res = await getMonthSummary();
  const slides = res.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/" aria-label="Back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Month in Review</h1>
          <p className="text-sm text-slate-500">Celebrate your family&apos;s wins this month</p>
        </div>
      </div>

      <MonthSummarySlideshow slides={slides} />

      <p className="text-center text-xs text-slate-500">
        Slides advance automatically every 4 seconds. Use the arrows to navigate.
      </p>
    </div>
  );
}
