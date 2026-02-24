"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FAMILY_EMAIL_SUFFIX = "@family.local";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const code = loginCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "family";
    const email = `${code}${FAMILY_EMAIL_SUFFIX}`;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (signUpError) {
      if (signUpError.message?.includes("already registered")) {
        alert("This family code is already taken. Choose another.");
      } else {
        alert(signUpError.message);
      }
      setLoading(false);
      return;
    }

    const { data: familyId, error } = await supabase.rpc("create_family_and_join", {
      p_name: name || "Me",
      p_family_name: familyName || "My Family",
      p_login_code: code,
    });

    if (error || !familyId) {
      if (error?.message?.includes("already has a family")) {
        router.push("/");
        router.refresh();
        setLoading(false);
        return;
      }
      alert(error?.message ?? "Failed to create family");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <p className="text-slate-500">
            Create your family to get started. One login for the whole family.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyName">Family name</Label>
              <Input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Smiths"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginCode">Family login code</Label>
              <Input
                id="loginCode"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="e.g. smith or smith-123"
                required
              />
              <p className="text-xs text-slate-500">
                Letters, numbers, hyphens only. You&apos;ll use this to sign in.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Family"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
