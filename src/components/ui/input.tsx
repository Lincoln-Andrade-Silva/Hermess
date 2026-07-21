import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          // Altura fixa para casar com o Select, que é um button e não teria a
          // mesma caixa se ambos dependessem só do padding.
          "h-[50px] w-full rounded-lg border border-line bg-surface px-4 text-[15px] text-ink outline-none transition placeholder:text-muted2 focus:border-brand focus:bg-surface2 focus:ring-2 focus:ring-brand/10 disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
