"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/components/utils";

// Shortened address (full one on hover) with a copy button
export const CopyAddress = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  // Reset the "copied" check mark after a moment
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm" title={value}>
        {shortenAddress(value)}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Copy address"
        title="Copy address"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      >
        {copied ? <Check className="text-green-500" /> : <Copy />}
      </Button>
    </span>
  );
};
