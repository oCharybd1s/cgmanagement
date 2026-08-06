import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { isCoach } from "@/lib/auth/roles";
import { getComsulReportForSession } from "@/lib/reports/data";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ReportAccessDenied } from "@/components/reports/report-access-denied";
import { ReportDashboard } from "@/components/reports/report-dashboard";

export default async function LaporanStatistikPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  if (!isCoach(session.role)) {
    return (
      <AppShell title="Laporan Statistik" user={toShellUser(session)}>
        <Container size="lg">
          <Section spacing="lg">
            <ReportAccessDenied />
          </Section>
        </Container>
      </AppShell>
    );
  }

  const report = await getComsulReportForSession(session);

  return (
    <AppShell title="Laporan Statistik" user={toShellUser(session)}>
      <Container size="xl">
        <Section spacing="lg">
          <ReportDashboard report={report} />
        </Section>
      </Container>
    </AppShell>
  );
}
