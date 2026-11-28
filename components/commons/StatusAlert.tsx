import { CircleCheck, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// success: green, for what just worked. warning: amber, for what to know
// before acting
const VARIANTS = {
  success: {
    icon: CircleCheck,
    alert:
      "border-green-600/30 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-950/40 dark:text-green-300",
    description: "text-green-800/90 dark:text-green-300/90",
  },
  warning: {
    icon: TriangleAlert,
    alert:
      "border-amber-600/30 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200",
    description: "text-amber-900/90 dark:text-amber-200/90",
  },
} as const;

// A colored message with a title and, as its body, a link (a transaction on the
// Solana Explorer, an uploaded file on IPFS...) and/or some text
export const StatusAlert = ({
  variant = "success",
  title,
  href,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  title: string;
  href?: string;
  children?: React.ReactNode;
}) => {
  const { icon: Icon, alert, description } = VARIANTS[variant];

  return (
    <Alert
      role={variant === "success" ? "status" : undefined}
      className={alert}
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className={description}>
        {children}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="break-all font-mono text-xs underline underline-offset-4"
          >
            {href}
          </a>
        )}
      </AlertDescription>
    </Alert>
  );
};
