import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { getNotificationsForSession } from "@/lib/notifications/inbox";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { NotificationCenterList } from "@/components/notifications/notification-center-list";

export default async function NotifikasiPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  const result = await getNotificationsForSession(session);

  return (
    <AppShell title="Notifikasi" user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg">
          <NotificationCenterList
            initialNotifications={result.notifications}
            initialUnreadCount={result.unreadCount}
            initialCursor={result.nextCursor}
          />
        </Section>
      </Container>
    </AppShell>
  );
}
