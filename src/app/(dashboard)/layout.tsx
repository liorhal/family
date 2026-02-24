import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { debugLog } from "@/lib/debug-log";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  debugLog("layout.tsx", "layout_entry", { hypothesisId: "H2,H3" });
  // #endregion
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // #region agent log
  debugLog("layout.tsx", "layout_after_getUser", { hypothesisId: "H2,H3", hasUser: !!user });
  // #endregion

  if (!user) {
    debugLog("layout.tsx", "layout_redirect_login", { hypothesisId: "H2" });
    redirect("/auth/login");
  }

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // #region agent log
  debugLog("layout.tsx", "layout_after_member", { hypothesisId: "H2", hasMember: !!member });
  // #endregion

  if (!member) {
    debugLog("layout.tsx", "layout_redirect_onboarding", { hypothesisId: "H2" });
    redirect("/onboarding");
  }

  debugLog("layout.tsx", "layout_render", { hypothesisId: "H2" });
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <Header
        memberName={member.name}
        memberRole={member.role}
        avatarUrl={member.avatar_url}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
