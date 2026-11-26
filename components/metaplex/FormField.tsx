import { Label } from "@/components/ui/label";

// A label, its control and its error message, shared by the collection forms
export const FormField = ({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && (
      <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);
