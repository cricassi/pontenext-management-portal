import { LoginForm } from "@/components/auth/LoginForm";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <section className="flex items-center justify-center bg-[#0B0B0B] px-4 py-4 text-white lg:min-h-screen lg:px-12 lg:py-10">
        <div className="w-full max-w-xl">
          <BrandLogo
            className="mx-auto justify-center lg:hidden"
            priority
          />
          <BrandLogo
            variant="full"
            priority
            className="hidden border border-white/10 shadow-2xl shadow-black/50 lg:block"
          />
          <div className="mt-4 hidden border-l-2 border-primary pl-4 lg:block">
            <p className="text-sm font-semibold uppercase tracking-normal text-white">
              Ponte Next APS
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
              Territorio, comunita e gestione associativa in un portale
              amministrativo semplice da usare.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-6 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-5 lg:mb-8">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Area amministrativa
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
              Accesso amministratori
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Entra per gestire soci, iscrizioni, scadenze e attivita
              associative.
            </p>
          </div>
          <LoginForm
            isSupabaseConfigured={hasSupabaseEnv()}
            nextPath={next ?? "/dashboard"}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground lg:mt-8">
            2026 Ponte Next APS
          </p>
        </div>
      </section>
    </main>
  );
}
