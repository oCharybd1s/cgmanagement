import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { toShellUser } from "@/lib/auth/shell-user";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";
import { ComingSoon } from "@/components/common/coming-soon";

export default async function VipPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell title="List VIP" user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg">
          <ComingSoon
            icon={UserPlus}
            title="List VIP"
            description="Pipeline follow-up calon anggota, dari status pending sampai accept atau reject, per CG."
          />
        </Section>
      </Container>
    </AppShell>
  );
}
