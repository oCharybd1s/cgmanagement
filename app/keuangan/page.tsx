import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";

export default async function KeuanganPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell title="Keuangan" user={{ email: session.email, role: session.role }}>
      <Container size="md">
        <Section spacing="lg">
          <ComingSoon
            icon={Wallet}
            title="Keuangan"
            description="Satu ledger terpusat buat kas Coach dan tiap CG, lengkap dengan transfer antar akun dan riwayat transaksi yang auditable."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
