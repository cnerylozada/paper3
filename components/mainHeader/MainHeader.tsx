import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeaderActions } from "@/components/mainHeader/HeaderActions";

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/">
          <Logo className="h-8" />
        </Link>
        <div className="flex items-center gap-3">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
