"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// One choice out of a short list, drawn as pills. The radios are real (arrow
// keys and screen readers work), only hidden behind the pill
export const ChipRadioGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
  invalid,
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  invalid?: boolean;
}) => (
  <RadioGroup
    value={value ?? null}
    onValueChange={(next) => onChange(next as T)}
    aria-label={label}
    aria-invalid={invalid}
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
);
