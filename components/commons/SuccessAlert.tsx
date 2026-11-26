import { CircleCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Success message with a link: a transaction on the Solana Explorer, an
// uploaded file on IPFS...
export const SuccessAlert = ({
  title,
  href,
}: {
  title: string;
  href: string;
}) => (
  <Alert
    role="status"
    className="border-green-600/30 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-950/40 dark:text-green-300"
  >
    <CircleCheck />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="text-green-800/90 dark:text-green-300/90">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all font-mono text-xs underline underline-offset-4"
      >
        {href}
      </a>
    </AlertDescription>
  </Alert>
);
