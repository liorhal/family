"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Home, Calendar, Settings, LogOut, Award } from "lucide-react";

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
    { href: "/badges", label: "Badges", icon: Award },
    ...(memberRole === "admin" ? [{ href: "/admin", label: "Parent", icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <nav className="flex items-center gap-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? "secondary" : "ghost"}
                size="lg"
                className="gap-2.5 px-5 text-base [&_svg]:size-5"
              >
                <Icon className="h-5 w-5" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden text-base font-medium text-slate-600 sm:inline">{memberName}</span>
          <MemberAvatar
            name={memberName ?? "?"}
            avatarUrl={avatarUrl}
            size="md"
          />
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={signOut}
            title="Sign out"
            className="[&_svg]:size-5"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
