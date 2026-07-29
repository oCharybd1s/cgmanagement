import { redirect } from "next/navigation";
import { Sunrise, Shield, Users2 } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { cgGroupDisplayLabel, canCreateMeetingReport, canBroadcastNotification, getRoleLabel, isCoach } from "@/lib/auth/roles";
import { toShellUser } from "@/lib/auth/shell-user";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { getMembersForSession } from "@/lib/members/data";
import { getKasAccountsForSession } from "@/lib/kas-accounts/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { QuickLaporanCard } from "@/components/laporan/quick-laporan-card";
import { KasSummaryCard } from "@/components/keuangan/kas-summary-card";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { NotificationTestCard } from "@/components/notifications/notification-test-card";

export default async function HomePage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  const canQuickLaporan = canCreateMeetingReport(session.role);
  const cgGroups =
    isCoach(session.role) && session.orgId ? await getCgGroupsForOrg(session.orgId) : [];

  const [members, kasAccounts] = await Promise.all([
    getMembersForSession(session),
    getKasAccountsForSession(session, cgGroups),
  ]);

  return (
    <AppShell user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg" className="flex flex-col gap-6">
          <NotificationTestCard canBroadcast={canBroadcastNotification(session.role)} />
          <CalendarBoard
            mode="week"
            viewerUid={session.uid}
            viewerRole={session.role}
            viewerCgGroupId={session.cgGroupId}
            members={members}
            cgGroups={cgGroups}
          />
          {canQuickLaporan ? <QuickLaporanCard cgGroups={cgGroups} viewerRole={session.role} /> : null}
          <KasSummaryCard accounts={kasAccounts} cgGroups={cgGroups} />
        </Section>
      </Container>
    </AppShell>
  );
}
