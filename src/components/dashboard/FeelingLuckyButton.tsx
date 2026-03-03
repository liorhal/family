"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Home, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export type LuckyActivity =
  | { type: "house"; id: string; title: string; score_value: number }
  | { type: "sport"; id: string; title: string; score_value: number };

interface FeelingLuckyButtonProps {
  activities: LuckyActivity[];
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="8" x="2" y="2" rx="1" />
      <path d="M15 2h6v6" />
      <path d="M15 9h6v6" />
      <path d="M2 15h6v6" />
      <path d="M9 15h6v6" />
    </svg>
  );
}

export function FeelingLuckyButton({ activities }: FeelingLuckyButtonProps) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<LuckyActivity | null>(null);
  const [rolling, setRolling] = useState(false);

  const hasActivities = activities.length > 0;

  const pickRandom = () => {
    if (activities.length === 0) return null;
    const idx = Math.floor(Math.random() * activities.length);
    return activities[idx];
  };

  const handleRoll = () => {
    if (!hasActivities) return;
    setRolling(true);
    // Brief shuffle animation - cycle through a few before landing
    let count = 0;
    const maxShuffles = 5;
    const interval = setInterval(() => {
      setSuggestion(pickRandom());
      count++;
      if (count >= maxShuffles) {
        clearInterval(interval);
        setRolling(false);
      }
    }, 80);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSuggestion(null); }}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={!hasActivities} title={hasActivities ? "Get a random activity suggestion" : "No unassigned activities today"}>
          <DiceIcon className="mr-2 h-5 w-5" />
          I&apos;m feeling lucky
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>I&apos;m feeling lucky</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <p className="text-sm text-slate-500 text-center">
            {hasActivities
              ? "Click the dice to get a random activity available today (no assignee yet)."
              : "No unassigned activities today. All tasks and sport activities are already taken!"}
          </p>
          {hasActivities && (
            <button
              type="button"
              onClick={handleRoll}
              disabled={rolling}
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-slate-400 hover:bg-slate-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70",
                rolling && "animate-pulse"
              )}
              title="Roll the dice"
            >
              <DiceIcon className="h-10 w-10 text-slate-600" />
            </button>
          )}
          {suggestion && (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Suggested activity</p>
              <div className="mt-2 flex items-center gap-2">
                {suggestion.type === "house" ? (
                  <Home className="h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <Dumbbell className="h-5 w-5 shrink-0 text-purple-600" />
                )}
                <span className="font-medium">{suggestion.title}</span>
                <Badge variant={suggestion.type === "house" ? "house" : "sport"} className="ml-auto shrink-0">
                  +{suggestion.score_value}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Scroll down to assign and complete this activity.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
