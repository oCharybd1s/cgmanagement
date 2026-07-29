import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { isCoach } from "@/lib/auth/roles";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { getMembersForSession } from "@/lib/members/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { CalendarBoard } from "@/components/calendar/calendar-board";

export default async function KalenderPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  const [cgGroups, members] = await Promise.all([
    isCoach(session.role) && session.orgId ? getCgGroupsForOrg(session.orgId) : Promise.resolve([]),
    getMembersForSession(session),
  ]);

  return (
    <AppShell title="Kalender" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <CalendarBoard
            mode="month"
            viewerUid={session.uid}
            viewerRole={session.role}
            viewerCgGroupId={session.cgGroupId}
            members={members}
            cgGroups={cgGroups}
          />
        </Section>
      </Container>
    </AppShell>
  );
}
