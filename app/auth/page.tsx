import { LoginBlobs } from "@/components/auth/login-blobs";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-10">
      <ThemeToggle className="fixed right-5 top-[calc(env(safe-area-inset-top)+16px)] z-20" />

      <div className="relative aspect-square w-[min(600px,92vw)]">
        <LoginBlobs />
        <div className="absolute inset-0 flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
