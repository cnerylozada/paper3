"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { AppButton } from "@/components/commons/AppButton";
import { FormField } from "@/components/commons/FormField";
import { cn } from "@/lib/utils";
import { HashSvgPreview } from "./HashSvgPreview";
import { MAX_PDF_MB } from "../models";

// A PDF picked by dragging it here or with the file dialog. It only holds the
// file: reading it is up to the form
export const PdfDropzone = ({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: File | undefined;
  onChange: (file: File | undefined) => void;
  error?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const remove = () => {
    // So choosing the same file again fires a change
    if (inputRef.current) inputRef.current.value = "";
    onChange(undefined);
  };

  return (
    <FormField id={id} label={label} error={error}>
      {value ? (
        <HashSvgPreview file={value} onRemove={remove} />
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) onChange(file);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center transition-colors",
            isDragging && "border-primary bg-primary/5",
            error && "border-destructive",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <p className="font-medium">Drag your PDF here</p>
          <p className="text-sm text-muted-foreground">or</p>
          <AppButton
            type="button"
            outline
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </AppButton>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onChange(file);
            }}
          />
          <p className="text-xs text-muted-foreground">
            PDF only, up to {MAX_PDF_MB} MB.
          </p>
        </div>
      )}
    </FormField>
  );
};
