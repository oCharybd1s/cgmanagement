import { ThemeToggle } from "@/components/ui/theme-toggle";

export function MobileHeader({ title }: { title: string }) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <h1 className="font-display text-base font-bold tracking-tight">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
