"use client";

import { cn } from "@/lib/cn";

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-line2")}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          on ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}
