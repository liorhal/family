"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = DropdownMenuPrimitive.Content;

function DropdownMenuContentStyled({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-800 dark:bg-slate-950",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
}

const DropdownMenuItem = DropdownMenuPrimitive.Item;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContentStyled as DropdownMenuContent,
  DropdownMenuItem,
};
