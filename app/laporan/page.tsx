import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";

export default async function LaporanPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell title="Laporan CG" user={{ email: session.email, role: session.role }}>
      <Container size="md">
        <Section spacing="lg">
          <ComingSoon
            icon={NotebookPen}
            title="Laporan CG"
            description="Form digital pengganti Google Form buat catat tanggal pertemuan, agenda, dan hasil pertemuan tiap CG."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
