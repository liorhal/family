import { cn } from "@/lib/utils";

export type CategoryType = "house" | "sport" | "school" | "custom" | "bonus" | "fine" | "streak_bonus" | "birthday_bonus";

const CATEGORY_CONFIG: Record<
  CategoryType,
  { emoji: string; circleColor: string; label: string }
> = {
  house: { emoji: "🏠", circleColor: "bg-green-500/20 ring-green-500/40", label: "House" },
  sport: { emoji: "🏃‍♂️", circleColor: "bg-orange-500/20 ring-orange-500/40", label: "Sport" },
  school: { emoji: "📚", circleColor: "bg-purple-500/20 ring-purple-500/40", label: "School" },
  custom: { emoji: "✨", circleColor: "bg-yellow-500/20 ring-yellow-500/40", label: "Custom" },
  bonus: { emoji: "✨", circleColor: "bg-amber-500/20 ring-amber-500/40", label: "Bonus" },
  fine: { emoji: "⚠️", circleColor: "bg-red-500/20 ring-red-500/40", label: "Fine" },
  streak_bonus: { emoji: "🔥", circleColor: "bg-orange-500/20 ring-orange-500/40", label: "Streak" },
  birthday_bonus: { emoji: "🎂", circleColor: "bg-pink-500/20 ring-pink-500/40", label: "Birthday" },
};

export function CategoryIcon({
  type,
  size = "md",
  className,
}: {
  type: CategoryType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = CATEGORY_CONFIG[type];
  const sizeClass = size === "sm" ? "h-8 w-8 text-base" : size === "lg" ? "h-12 w-12 text-2xl" : "h-10 w-10 text-xl";

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full ring-2",
        config.circleColor,
        sizeClass,
        className
      )}
      title={config.label}
    >
      {config.emoji}
    </span>
  );
}

export function getCategoryIcon(type: CategoryType): string {
  return CATEGORY_CONFIG[type]?.emoji ?? "✨";
}
