import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canCreateOrganization } from "@/lib/auth/roles";
import { getOrganizationsForSession } from "@/lib/organizations/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { OrganizationAdminPanel } from "@/components/organizations/organization-admin-panel";

export default async function AdminOrganizationsPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!canCreateOrganization(session.role)) {
    redirect("/home");
  }

  const organizations = await getOrganizationsForSession(session);

  return (
    <AppShell title="Organisasi" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <OrganizationAdminPanel initialOrganizations={organizations} />
        </Section>
      </Container>
    </AppShell>
  );
}
