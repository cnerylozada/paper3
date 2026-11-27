"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// A few short words typed one by one. Enter or a comma adds the word, a click
// on a chip removes it, Backspace on the empty box removes the last one
export const KeywordsInput = ({
  id,
  value,
  onChange,
  max,
  maxLength,
  invalid,
  describedBy,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  max: number;
  maxLength: number;
  invalid?: boolean;
  describedBy?: string;
}) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const word = draft.trim();
    setDraft("");
    const exists = value.some((v) => v.toLowerCase() === word.toLowerCase());
    if (word && !exists && value.length < max) onChange([...value, word]);
  };

  return (
    <div
      className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
      aria-invalid={invalid}
    >
      {value.map((word) => (
        <Badge
          key={word}
          variant="secondary"
          render={<button type="button" />}
          onClick={() => onChange(value.filter((v) => v !== word))}
          aria-label={`Remove ${word}`}
          className="h-7 cursor-pointer gap-1.5 px-3 text-sm"
        >
          {word}
          <X aria-hidden />
        </Badge>
      ))}
      {value.length < max && (
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder="Add a keyword, press Enter"
          autoComplete="off"
          aria-describedby={describedBy}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={add}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          className="h-7 min-w-40 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      )}
    </div>
  );
};
