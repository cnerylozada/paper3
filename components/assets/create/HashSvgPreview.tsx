"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AppButton } from "@/components/commons/AppButton";
import { Badge } from "@/components/ui/badge";
import { buildSvg, hashFile, toHex } from "../utils";

// The image the NFT will have, drawn from the PDF's hash. The same PDF always
// gives the same picture, and the PDF itself never leaves the browser here
export const HashSvgPreview = ({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) => {
  const [preview, setPreview] = useState<{ svg: string; hash: string } | null>(
    null,
  );

  useEffect(() => {
    let isCurrent = true;
    hashFile(file).then((hash) => {
      if (isCurrent) setPreview({ svg: buildSvg(hash), hash: toHex(hash) });
    });
    return () => {
      isCurrent = false;
    };
  }, [file]);

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(preview.svg)}`}
          alt="Image generated from the PDF's hash"
          className="size-32 shrink-0 rounded-lg"
        />
      ) : (
        <div className="size-32 shrink-0 animate-pulse rounded-lg bg-muted" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
            PDF
          </Badge>
          <span className="truncate font-medium">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
        <span className="text-muted-foreground">
          Your NFT image, drawn from the SHA-256 of your PDF: the same file
          always gives the same picture.
        </span>
        {preview && (
          <span className="truncate font-mono text-xs text-muted-foreground">
            {preview.hash}
          </span>
        )}
      </div>
      <AppButton
        type="button"
        outline
        size="icon"
        icon={X}
        aria-label="Remove file"
        onClick={onRemove}
        className="self-start"
      />
    </div>
  );
};
