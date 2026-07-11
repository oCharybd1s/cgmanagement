import { LoginForm } from "@/components/auth/login-form";
import { GrowthContours } from "@/components/ui/growth-contours";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-10">
      <div className="absolute inset-0">
        <GrowthContours className="h-full w-full scale-125" />
      </div>

      <ThemeToggle className="fixed right-5 top-[calc(env(safe-area-inset-top)+16px)] z-20" />

      <LoginForm />
    </div>
  );
}
