import { cn } from "@/lib/cn";

type Tone = "success" | "muted" | "brand" | "warning" | "danger" | "info" | "purple" | "dark";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-600/20 bg-emerald-50 text-emerald-700",
  muted: "border-line bg-surface text-muted",
  brand: "border-line2 bg-surface2 text-ink",
  warning: "border-amber-600/20 bg-amber-50 text-amber-700",
  danger: "border-red-600/20 bg-red-50 text-red-700",
  info: "border-blue-600/20 bg-blue-50 text-blue-700",
  purple: "border-violet-600/20 bg-violet-50 text-violet-700",
  dark: "border-ink bg-ink text-bg",
};

export function Badge({ tone = "brand", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
