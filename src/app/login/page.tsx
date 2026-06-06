import { LoginForm } from "@/components/auth/LoginForm";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            PonteNext Management Portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            Accesso amministratori
          </h1>
        </div>
        <LoginForm
          isSupabaseConfigured={hasSupabaseEnv()}
          nextPath={next ?? "/dashboard"}
        />
      </div>
    </main>
  );
}
