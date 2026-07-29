import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { isCoach } from "@/lib/auth/roles";
import { getKasAccountsForSession } from "@/lib/kas-accounts/data";
import { getTransactionsForAccounts } from "@/lib/transactions/data";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { KeuanganDashboard } from "@/components/keuangan/keuangan-dashboard";

export default async function KeuanganPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  const cgGroups =
    isCoach(session.role) && session.orgId ? await getCgGroupsForOrg(session.orgId) : [];

  const accounts = await getKasAccountsForSession(session, cgGroups);
  const transactions = await getTransactionsForAccounts(
    session.orgId ?? "",
    accounts.map((account) => account.id),
  );

  return (
    <AppShell title="Keuangan" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <KeuanganDashboard
            initialAccounts={accounts}
            initialTransactions={transactions}
            cgGroups={cgGroups}
            viewerRole={session.role}
            viewerCgGroupId={session.cgGroupId}
            viewerIsBendahara={session.isBendahara}
          />
        </Section>
      </Container>
    </AppShell>
  );
}
