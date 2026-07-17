import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";

export default async function KalenderPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell title="Kalender" user={{ email: session.email, role: session.role }}>
      <Container size="md">
        <Section spacing="lg">
          <ComingSoon
            icon={CalendarDays}
            title="Kalender"
            description="Gabungan event dan ulang tahun dalam satu tampilan, plus statistik ulang tahun anggota per CG."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
