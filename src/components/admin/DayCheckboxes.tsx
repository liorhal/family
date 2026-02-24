"use client";

import { Label } from "@/components/ui/label";
import { getDayName } from "@/lib/utils";

interface DayCheckboxesProps {
  name?: string;
  defaultDays?: number[];
}

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function DayCheckboxes({ name = "scheduled_days", defaultDays = [] }: DayCheckboxesProps) {
  return (
    <div className="space-y-2">
      <Label>Days (0=Sun, 6=Sat)</Label>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <label
            key={day}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
          >
            <input
              type="checkbox"
              name={name}
              value={day}
              defaultChecked={defaultDays.includes(day)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {getDayName(day)}
          </label>
        ))}
      </div>
    </div>
  );
}
