import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full resize-y rounded-lg border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted2 focus:border-brand focus:bg-surface2 focus:ring-2 focus:ring-brand/10 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
