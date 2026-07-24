import { cn } from "@/lib/cn";

type Tone = "success" | "muted" | "brand" | "warning" | "danger" | "info" | "purple" | "dark";

const toneClasses: Record<Tone, string> = {
  success: "border-success-line bg-success-surface text-success-ink",
  muted: "border-line bg-surface text-muted",
  brand: "border-line2 bg-surface2 text-ink",
  warning: "border-warning-line bg-warning-surface text-warning-ink",
  danger: "border-danger-line bg-danger-surface text-danger-ink",
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
