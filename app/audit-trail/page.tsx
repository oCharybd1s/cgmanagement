import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { canViewAuditTrail } from "@/lib/auth/roles";
import { getOrganizationLogForSession } from "@/lib/organizations/log";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { AuditTrailList } from "@/components/organizations/audit-trail-list";

export default async function AuditTrailPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!canViewAuditTrail(session.role)) {
    redirect("/home");
  }

  const entries = await getOrganizationLogForSession(session);

  return (
    <AppShell title="Audit Trail" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <AuditTrailList entries={entries} />
        </Section>
      </Container>
    </AppShell>
  );
}
