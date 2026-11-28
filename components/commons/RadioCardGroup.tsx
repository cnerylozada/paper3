"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// One choice out of a few, drawn as cards with a title and a description. The
// radios are real, so the arrow keys and screen readers work
export const RadioCardGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; title: string; description: string }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <RadioGroup
    value={value}
    onValueChange={(next) => onChange(next as T)}
    aria-label={label}
    className="grid-cols-1 gap-3 sm:grid-cols-2"
  >
    {options.map(({ value: option, title, description }) => (
      <Label
        key={option}
        className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
      >
        <RadioGroupItem value={option} className="mt-0.5" />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs leading-relaxed font-normal text-muted-foreground">
            {description}
          </span>
        </span>
      </Label>
    ))}
  </RadioGroup>
);
