import { Sidebar } from "./sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
import { MobileHeader } from "./mobile-header";
import { GrowthContours } from "@/components/ui/growth-contours";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0">
        <GrowthContours className="h-full w-full" />
      </div>
      <div className="relative z-10 flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader title={title} />
          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
          <MobileTabBar />
        </div>
      </div>
    </div>
  );
}