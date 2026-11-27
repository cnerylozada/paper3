import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// A quiet "← Back" link for the top of a page
export const BackLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Button
    nativeButton={false}
    render={<Link href={href} />}
    variant="ghost"
    size="sm"
    className="-ml-2 self-start text-muted-foreground"
  >
    <ArrowLeft />
    {children}
  </Button>
);
