import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { ForceChangePasswordGate } from "@/components/auth/force-change-password-gate";
import type { ShellUser } from "@/lib/auth/shell-user";

export function AppShell({
  children,
  title,
  user,
}: {
  children: React.ReactNode;
  title?: string;
  user?: ShellUser | null;
}) {
  if (user?.mustChangePassword) {
    return <ForceChangePasswordGate />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-dvh bg-background">
        <Sidebar />
        <MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} user={user} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}