import { redirect } from "next/navigation";
import { Sunrise, Shield, Users2 } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { cgGroupDisplayLabel, getRoleLabel } from "@/lib/auth/roles";
import { toShellUser } from "@/lib/auth/shell-user";
import { AppShell } from "@/components/layout/app-shell";
import { Container, Section } from "@/components/layout/container";

export default async function HomePage() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <AppShell showBrand user={toShellUser(session)}>
      <Container size="md">
        <Section spacing="lg" className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-6 py-5 shadow-sm backdrop-blur-xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sunrise className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-bold tracking-tight text-foreground">
                Selamat datang, {session.email}
              </h1>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Shield className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role
                </p>
                <p className="mt-0.5 font-display text-base font-bold text-foreground">
                  {getRoleLabel(session.role)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Users2 className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  CG
                </p>
                <p className="mt-0.5 font-display text-base font-bold text-foreground">
                  {cgGroupDisplayLabel(session.role, session.cgGroupId)}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </Container>
    </AppShell>
  );
}
