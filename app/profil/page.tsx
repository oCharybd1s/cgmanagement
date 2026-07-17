import { redirect } from "next/navigation";
import { UserCircle } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";

export default async function ProfilPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell title="Profil" user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg">
          <ComingSoon
            icon={UserCircle}
            title="Profil"
            description="Edit data diri, ubah password, dan update status rohani kamu sendiri."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
