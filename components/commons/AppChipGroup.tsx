"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "./FormField";

// One choice out of a short list, drawn as pills, with its label, hint and
// error. The radios are real (arrow keys and screen readers work), only hidden
// behind the pill
export const AppChipGroup = <T extends string>({
  id,
  label,
  hint,
  error,
  aside,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** At the end of the label row: a badge, a counter */
  aside?: React.ReactNode;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
}) => (
  <FormField id={id} label={label} hint={hint} error={error} aside={aside}>
    <RadioGroup
      value={value ?? null}
      onValueChange={(next) => onChange(next as T)}
      aria-label={label}
      aria-invalid={!!error}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => (
        <Label
          key={option}
          className="relative h-9 w-auto cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/10 has-data-checked:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
        >
          <RadioGroupItem
            value={option}
            className="absolute inset-0 size-full rounded-full border-0 opacity-0"
          />
          {option}
        </Label>
      ))}
    </RadioGroup>
  </FormField>
);
