import { redirect } from "next/navigation";
import { Network } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";

export default async function StrukturPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell title="Struktur Organisasi" user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg">
          <ComingSoon
            icon={Network}
            title="Struktur Organisasi"
            description="Visual tree Coach → CG → CGL → Sponsor → Member/Simpatisan, lengkap dengan promote, demote, dan replace beserta riwayatnya."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
