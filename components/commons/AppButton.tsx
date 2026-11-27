import { LoaderCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppButtonTheme = "primary" | "secondary" | "danger";

// The look of each theme: filled, or `outline` for a border with plain text
const VARIANTS = {
  primary: { solid: "default", outline: "outline" },
  secondary: { solid: "secondary", outline: "outline" },
  danger: { solid: "destructive", outline: "outline" },
} as const;

// The app's button, a thin wrapper of the shadcn Button. It keeps what every
// action needs in one place: a theme, an optional icon, and a `loading` state
// that shows a spinner and disables the button while the action runs
export const AppButton = ({
  children,
  theme = "primary",
  outline = false,
  icon: Icon,
  loading = false,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant"> & {
  theme?: AppButtonTheme;
  /** Border and plain text instead of a filled background */
  outline?: boolean;
  /** Icon shown before the text */
  icon?: LucideIcon;
  loading?: boolean;
}) => (
  <Button
    variant={VARIANTS[theme][outline ? "outline" : "solid"]}
    disabled={disabled || loading}
    aria-busy={loading}
    className={className}
    {...props}
  >
    {loading ? <LoaderCircle className="animate-spin" /> : Icon && <Icon />}
    {children}
  </Button>
);
