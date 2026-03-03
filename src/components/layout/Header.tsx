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
      <div className="mx-auto flex h-16 min-w-0 max-w-6xl items-center justify-between gap-2 overflow-hidden px-4 sm:h-20 sm:px-6">
        <nav className="flex min-w-0 shrink-0 items-center gap-1 overflow-x-auto sm:gap-2 [&::-webkit-scrollbar]:hidden">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="shrink-0" title={label}>
              <Button
                variant={pathname === href ? "secondary" : "ghost"}
                size="sm"
                className="h-10 min-h-[44px] gap-1.5 px-3 text-sm sm:h-11 sm:gap-2.5 sm:px-5 sm:text-base [&_svg]:size-[1.25rem] sm:[&_svg]:size-5"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden text-sm font-medium text-slate-600 sm:inline">{memberName}</span>
          <MemberAvatar
            name={memberName ?? "?"}
            avatarUrl={avatarUrl}
            size="md"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sign out"
            className="h-10 min-h-[44px] min-w-[44px] sm:h-12 sm:min-h-[48px] sm:min-w-[48px] [&_svg]:size-5"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
