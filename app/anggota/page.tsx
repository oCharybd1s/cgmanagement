import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import {
  canViewMemberDirectory,
  hasFullMemberDirectoryAccess,
  memberDirectoryFieldScope,
} from "@/lib/auth/roles";
import { getMembersForSession } from "@/lib/members/data";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { MemberDirectory } from "@/components/members/member-directory";
import { MemberAccessDenied } from "@/components/members/member-access-denied";

export default async function AnggotaPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!canViewMemberDirectory(session.role)) {
    return (
      <AppShell title="Data Anggota" user={toShellUser(session)}>
        <Container size="md">
          <Section spacing="lg">
            <MemberAccessDenied />
          </Section>
        </Container>
      </AppShell>
    );
  }

  const [members, cgGroups] = await Promise.all([
    getMembersForSession(session),
    hasFullMemberDirectoryAccess(session.role) && session.orgId
      ? getCgGroupsForOrg(session.orgId)
      : Promise.resolve([]),
  ]);

  return (
    <AppShell title="Data Anggota" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <MemberDirectory
            members={members}
            cgGroups={cgGroups}
            fields={memberDirectoryFieldScope(session.role)}
          />
        </Section>
      </Container>
    </AppShell>
  );
}
