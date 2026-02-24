"use client";

import { useState, useEffect } from "react";

const log = (msg: string, data: object) => {
  fetch("/api/debug-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "login/page.tsx", message: msg, data }) }).catch(() => {});
};
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FAMILY_EMAIL_SUFFIX = "@family.local";

export default function LoginPage() {
  const router = useRouter();
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // #region agent log
    log("login_mount", { hypothesisId: "H5" });
    // #endregion
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      log("login_getUser_result", { hypothesisId: "H5", hasUser: !!user });
      if (user) router.replace("/");
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const email = `${loginCode.trim().toLowerCase()}${FAMILY_EMAIL_SUFFIX}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Family Productivity</CardTitle>
          <CardDescription>
            Sign in with your family code and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="loginCode" className="text-sm font-medium">
                Family code
              </label>
              <input
                id="loginCode"
                type="text"
                placeholder="e.g. smith or smith-123"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Don&apos;t have a family?{" "}
              <Link href="/onboarding" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
