import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import type { SessionUser } from "@/lib/auth/types";

type AppShellUser = Pick<SessionUser, "email" | "role">;

export function AppShell({
  children,
  title,
  showBrand,
  user,
}: {
  children: React.ReactNode;
  title?: string;
  showBrand?: boolean;
  user?: AppShellUser | null;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh bg-background">
        <Sidebar />
        <MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} showBrand={showBrand} user={user} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}