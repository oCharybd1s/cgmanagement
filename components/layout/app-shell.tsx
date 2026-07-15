import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { Topbar } from "./topbar";
import { MobileTabBar } from "./mobile-tab-bar";
import { GrowthContours } from "@/components/ui/growth-contours";
import type { SessionUser } from "@/lib/auth/types";

type AppShellUser = Pick<SessionUser, "email" | "role">;

export function AppShell({
  children,
  title,
  user,
}: {
  children: React.ReactNode;
  title: string;
  user?: AppShellUser | null;
}) {
  return (
    <SidebarProvider>
      <div className="relative min-h-dvh overflow-hidden bg-background">
        <div className="absolute inset-0">
          <GrowthContours className="h-full w-full" />
        </div>
        <div className="relative z-10 flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar title={title} user={user} />
            <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            <MobileTabBar />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
