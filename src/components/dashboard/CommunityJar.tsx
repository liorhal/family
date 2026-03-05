"use client";

const FAMILY_GOAL = 1500;
const MILESTONE_LABEL = "1,500 points = Family Movie Night 🍿";

interface CommunityJarProps {
  currentPoints: number;
}

export function CommunityJar({ currentPoints }: CommunityJarProps) {
  const progress = Math.min(100, (currentPoints / FAMILY_GOAL) * 100);
  const coinCount = Math.min(12, Math.floor((currentPoints / FAMILY_GOAL) * 12));

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-sm font-medium text-amber-800/90">
            Community Jar
          </p>
          <div className="relative h-32 w-28 overflow-hidden rounded-2xl border-2 border-amber-300/70 bg-amber-100/50 shadow-inner sm:h-40 sm:w-36">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-400/90 to-amber-300/70 transition-all duration-500"
              style={{ height: `${progress}%` }}
            />
            <div className="absolute inset-0 flex flex-wrap content-end justify-center gap-0.5 p-1">
              {Array.from({ length: coinCount }).map((_, i) => (
                <span
                  key={i}
                  className="text-lg sm:text-xl"
                  style={{ opacity: 0.9 - i * 0.05 }}
                >
                  🪙
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1 text-center sm:text-left">
          <p className="text-lg font-bold text-amber-900">
            {currentPoints.toLocaleString()} / {FAMILY_GOAL.toLocaleString()} pts
          </p>
          <p className="text-sm font-medium text-amber-700">
            {MILESTONE_LABEL}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
