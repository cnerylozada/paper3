import { CircleCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const explorerUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

// Success message with the Solana Explorer (devnet) link of a transaction
export const TransactionSuccess = ({ signature }: { signature: string }) => (
  <Alert>
    <CircleCheck />
    <AlertTitle>Transfer sent</AlertTitle>
    <AlertDescription>
      <a
        href={explorerUrl(signature)}
        target="_blank"
        rel="noreferrer"
        className="break-all font-mono text-xs underline underline-offset-4"
      >
        {explorerUrl(signature)}
      </a>
    </AlertDescription>
  </Alert>
);
