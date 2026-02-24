import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
        house: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        sport: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        school: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        streak: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
