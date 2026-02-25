"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Home, Calendar, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  memberName?: string;
  memberRole?: string;
  avatarUrl?: string | null;
}

export function Header({ memberName, memberRole, avatarUrl }: HeaderProps) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  const nav = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/today", label: "Today", icon: Calendar },
    ...(memberRole === "admin" ? [{ href: "/admin", label: "Parent", icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{memberName}</span>
          <MemberAvatar
            name={memberName ?? "?"}
            avatarUrl={avatarUrl}
            size="sm"
          />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
