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
  <Alert role="status">
    <CircleCheck />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
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
