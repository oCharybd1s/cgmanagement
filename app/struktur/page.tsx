import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canManageCgGroups, canViewOrganizationTree } from "@/lib/auth/roles";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { getOrganizationTreeForSession } from "@/lib/organizations/tree";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { CgGroupList } from "@/components/cg-groups/cg-group-list";
import { OrganizationTree } from "@/components/organizations/organization-tree";

export default async function StrukturPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  const showTree = canViewOrganizationTree(session.role);

  const [cgGroups, tree] = await Promise.all([
    session.orgId ? getCgGroupsForOrg(session.orgId) : Promise.resolve([]),
    showTree ? getOrganizationTreeForSession(session) : Promise.resolve(null),
  ]);

  return (
    <AppShell title="Struktur Organisasi" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg" className="flex flex-col gap-10">
          <CgGroupList initialCgGroups={cgGroups} canCreate={canManageCgGroups(session.role)} />

          {showTree && tree ? (
            <OrganizationTree tree={tree} viewerRole={session.role} viewerCgGroupId={session.cgGroupId} />
          ) : null}
        </Section>
      </Container>
    </AppShell>
  );
}
