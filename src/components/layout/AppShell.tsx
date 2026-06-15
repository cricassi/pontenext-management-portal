import { signOutAction } from "@/app/(admin)/actions";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import type { AdminUser } from "@/types/admin";

type AppShellProps = {
  admin: AdminUser;
  children: React.ReactNode;
};

export function AppShell({ admin, children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="flex min-h-screen min-w-0">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-900 bg-[#0B0B0B] text-white shadow-sm">
            <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <MobileNav />
                <BrandLogo className="min-w-0 flex-1 lg:hidden" priority />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-sm font-medium text-white">
                    {admin.fullName}
                  </p>
                  <p className="text-xs text-white/55">
                    {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                  </p>
                </div>
                <form action={signOutAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    Esci
                  </Button>
                </form>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
