import { Sidebar } from "./sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
import { MobileHeader } from "./mobile-header";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader title={title} />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <MobileTabBar />
      </div>
    </div>
  );
}
