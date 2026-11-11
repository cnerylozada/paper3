import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <Logo className="h-20 sm:h-28" />
      <p className="text-lg text-muted-foreground">
        Tokenize your intellectual property
      </p>
    </div>
  );
}
