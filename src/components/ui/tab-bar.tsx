"use client";

import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  ready?: boolean;
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const disabled = tab.ready === false;
        return (
          <button
            key={tab.key}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(tab.key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition",
              isActive ? "border-brand text-ink" : "border-transparent",
              disabled ? "cursor-not-allowed text-muted2" : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
            {disabled && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted2">
                em breve
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
