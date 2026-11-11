import { cn } from "@/lib/utils";

// "light" is the logo for light backgrounds, "dark" the one for dark backgrounds.
// Tailwind's `dark:` variant (class based, see globals.css) shows the matching one.
export const Logo = ({ className }: { className?: string }) => (
  <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/logos/paper3-logo-light.svg"
      alt="Paper3"
      className={cn("w-auto dark:hidden", className)}
    />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/logos/paper3-logo-dark.svg"
      alt="Paper3"
      className={cn("hidden w-auto dark:block", className)}
    />
  </>
);
