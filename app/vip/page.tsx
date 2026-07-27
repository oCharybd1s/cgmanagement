import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canViewVipList, isCoach } from "@/lib/auth/roles";
import { getVipProspectsForSession } from "@/lib/vip-prospects/data";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { getMembersForSession } from "@/lib/members/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { VipList } from "@/components/vip/vip-list";
import { VipAccessDenied } from "@/components/vip/vip-access-denied";

export default async function VipPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!canViewVipList(session.role)) {
    return (
      <AppShell title="List VIP" user={toShellUser(session)}>
        <Container size="md">
          <Section spacing="lg">
            <VipAccessDenied />
          </Section>
        </Container>
      </AppShell>
    );
  }

  const showCgColumn = isCoach(session.role);

  const [prospects, cgGroups, members] = await Promise.all([
    getVipProspectsForSession(session),
    showCgColumn && session.orgId ? getCgGroupsForOrg(session.orgId) : Promise.resolve([]),
    getMembersForSession(session),
  ]);

  return (
    <AppShell title="List VIP" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <VipList
            initialProspects={prospects}
            cgGroups={cgGroups}
            members={members}
            viewerRole={session.role}
            viewerCgGroupId={session.cgGroupId}
          />
        </Section>
      </Container>
    </AppShell>
  );
}
