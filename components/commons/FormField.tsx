import { Label } from "@/components/ui/label";

// A label, its control and its error message, shared by the collection forms.
// `aside` sits at the end of the label row (a badge, a character counter)
export const FormField = ({
  id,
  label,
  hint,
  error,
  aside,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id}>{label}</Label>
      {aside}
    </div>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && (
      <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);
