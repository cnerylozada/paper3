import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type AppButtonTheme, VARIANTS } from "./AppButton";

// AppButton that navigates: same themes and icon, rendered as a Next Link
export const AppLinkButton = ({
  href,
  children,
  theme = "primary",
  outline = false,
  icon: Icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  theme?: AppButtonTheme;
  /** Border and plain text instead of a filled background */
  outline?: boolean;
  /** Icon shown before the text */
  icon?: LucideIcon;
  className?: string;
}) => (
  <Button
    nativeButton={false}
    render={<Link href={href} />}
    variant={VARIANTS[theme][outline ? "outline" : "solid"]}
    className={className}
  >
    {Icon && <Icon />}
    {children}
  </Button>
);
