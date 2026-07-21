import { cn } from "@/lib/cn";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[11px] font-bold uppercase tracking-wider text-muted", className)}
      {...props}
    />
  );
}

interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {hint && <span className="ml-1 lowercase text-muted2">{hint}</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm font-medium text-red-400">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm font-medium text-emerald-400">
      {children}
    </p>
  );
}
