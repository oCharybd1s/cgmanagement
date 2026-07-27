import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canViewMeetingReports, isCoach } from "@/lib/auth/roles";
import { getMeetingReportsForSession } from "@/lib/meeting-reports/data";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { getMembersForSession } from "@/lib/members/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { LaporanList } from "@/components/laporan/laporan-list";
import { LaporanAccessDenied } from "@/components/laporan/laporan-access-denied";

export default async function LaporanPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!canViewMeetingReports(session.role)) {
    return (
      <AppShell title="Laporan CG" user={toShellUser(session)}>
        <Container size="md">
          <Section spacing="lg">
            <LaporanAccessDenied />
          </Section>
        </Container>
      </AppShell>
    );
  }

  const showCgFilter = isCoach(session.role);

  const [reports, cgGroups, members] = await Promise.all([
    getMeetingReportsForSession(session),
    showCgFilter && session.orgId ? getCgGroupsForOrg(session.orgId) : Promise.resolve([]),
    getMembersForSession(session),
  ]);

  return (
    <AppShell title="Laporan CG" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <LaporanList
            initialReports={reports}
            cgGroups={cgGroups}
            members={members}
            viewerRole={session.role}
          />
        </Section>
      </Container>
    </AppShell>
  );
}
