import { HeaderActions } from "@/components/mainHeader/HeaderActions";

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="text-lg font-semibold tracking-tight">
          FS1 SVM Dapp
        </span>
        <div className="flex items-center gap-3">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
