"use client";

import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-bold transition",
            value === option.value
              ? "bg-brand text-brand-fg shadow-brand"
              : "border border-line bg-surface text-muted hover:bg-surface2 hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
