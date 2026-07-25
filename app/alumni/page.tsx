import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canViewFormerMembers, isCoach } from "@/lib/auth/roles";
import { getFormerMembersForSession } from "@/lib/former-members/data";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { FormerMemberList } from "@/components/former-members/former-member-list";
import { FormerMemberAccessDenied } from "@/components/former-members/former-member-access-denied";

export default async function AlumniPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!canViewFormerMembers(session.role)) {
    return (
      <AppShell title="Past Member" user={toShellUser(session)}>
        <Container size="md">
          <Section spacing="lg">
            <FormerMemberAccessDenied />
          </Section>
        </Container>
      </AppShell>
    );
  }

  const showCgColumn = isCoach(session.role);

  const [formerMembers, cgGroups] = await Promise.all([
    getFormerMembersForSession(session),
    showCgColumn && session.orgId ? getCgGroupsForOrg(session.orgId) : Promise.resolve([]),
  ]);

  return (
    <AppShell title="Past Member" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <FormerMemberList formerMembers={formerMembers} cgGroups={cgGroups} showCgColumn={showCgColumn} />
        </Section>
      </Container>
    </AppShell>
  );
}
