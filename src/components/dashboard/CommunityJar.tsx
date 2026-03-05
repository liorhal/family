"use client";

interface CommunityJarProps {
  currentPoints: number;
  target?: number;
  prize?: string;
}

const DEFAULT_TARGET = 1500;
const DEFAULT_PRIZE = "1,500 points = Family Movie Night 🍿";

export function CommunityJar({ currentPoints, target = DEFAULT_TARGET, prize = DEFAULT_PRIZE }: CommunityJarProps) {
  const goal = Math.max(1, target);
  const progress = Math.min(100, (currentPoints / goal) * 100);
  const coinCount = Math.min(12, Math.floor((currentPoints / goal) * 12));

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-5 sm:py-4">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <p className="text-xs font-medium text-amber-800/90">Community Jar</p>
          <div className="relative h-20 w-16 overflow-hidden rounded-xl border-2 border-amber-300/70 bg-amber-100/50 shadow-inner sm:h-24 sm:w-20">
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
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-amber-900 sm:text-lg">
            {currentPoints.toLocaleString()} / {goal.toLocaleString()} pts
          </p>
          <p className="text-xs font-medium text-amber-700 sm:text-sm">
            {prize}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/60">
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
