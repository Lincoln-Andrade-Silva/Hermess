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
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-danger-line bg-danger-surface px-4 py-3 text-sm font-medium text-danger-ink">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-success-line bg-success-surface px-4 py-3 text-sm font-medium text-success-ink">
      {children}
    </p>
  );
}
