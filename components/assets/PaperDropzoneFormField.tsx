"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { FormField } from "../commons/FormField";
import { buildSvg, hashFile } from "./utils";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// A form field that receives one PDF. It is controlled (value/onChange), so it
// works with react-hook-form's Controller, and previews the image generated
// from the PDF's hash
export const PaperDropzoneFormField = ({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);

  const onDrop = async (accepted: File[], rejected: FileRejection[]) => {
    setDropError(null);
    if (rejected.length > 0) {
      setDropError(rejected[0].errors[0].message);
      return;
    }
    try {
      setSvg(buildSvg(await hashFile(accepted[0])));
      onChange(accepted[0]);
    } catch {
      setDropError("Could not read the file");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_SIZE,
  });

  return (
    <FormField id={id} label={label} error={dropError ?? error}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground",
          isDragActive && "border-primary text-foreground",
          (dropError || error) && "border-destructive",
        )}
      >
        <input id={id} {...getInputProps()} />
        {value && svg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
              alt={`Image generated from ${value.name}`}
              className="size-40 rounded-lg border"
            />
            <span className="text-xs">{value.name}</span>
          </>
        ) : (
          <>
            <FileText className="size-6" />
            {isDragActive
              ? "Drop the PDF here"
              : "Drag a PDF here (max 10 MB), or click to select one"}
          </>
        )}
      </div>
    </FormField>
  );
};
