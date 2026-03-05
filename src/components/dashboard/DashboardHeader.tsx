"use client";

import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  /** Default header text (custom or "[Family] Family Dashboard") */
  defaultHeader: string;
  /** Members with birthday today - header will periodically show "Happy Birthday [name]" */
  birthdayMembers: { name: string }[];
}

const ROTATE_INTERVAL_MS = 4000;

export function DashboardHeader({ defaultHeader, birthdayMembers }: DashboardHeaderProps) {
  const [showBirthday, setShowBirthday] = useState(true);
  const [birthdayIndex, setBirthdayIndex] = useState(0);

  useEffect(() => {
    if (birthdayMembers.length === 0) return;
    const interval = setInterval(() => {
      setShowBirthday((prev) => {
        if (!prev) {
          setBirthdayIndex((i) => (i + 1) % birthdayMembers.length);
          return true;
        }
        return false;
      });
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [birthdayMembers.length]);

  const hasBirthdays = birthdayMembers.length > 0;
  const displayText =
    hasBirthdays && showBirthday
      ? `Happy Birthday ${birthdayMembers[birthdayIndex]?.name}! 🎂`
      : defaultHeader;

  return (
    <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight sm:text-3xl">
      {displayText}
    </h1>
  );
}
