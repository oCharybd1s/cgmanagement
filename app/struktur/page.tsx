import { redirect } from "next/navigation";
import { Network } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canManageCgGroups } from "@/lib/auth/roles";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";
import { CgGroupList } from "@/components/cg-groups/cg-group-list";

export default async function StrukturPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  const cgGroups = session.orgId ? await getCgGroupsForOrg(session.orgId) : [];

  return (
    <AppShell title="Struktur Organisasi" user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg" className="flex flex-col gap-10">
          <CgGroupList initialCgGroups={cgGroups} canCreate={canManageCgGroups(session.role)} />

          <ComingSoon
            icon={Network}
            title="Visual Tree Struktur"
            description="Visual tree Coach → CG → CGL → Sponsor → Member/Simpatisan, lengkap dengan promote, demote, dan replace beserta riwayatnya."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
