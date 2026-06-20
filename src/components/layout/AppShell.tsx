import { signOutAction } from "@/app/(admin)/actions";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import type { AdminUser } from "@/types/admin";
import { LogOut } from "lucide-react";

type AppShellProps = {
  admin: AdminUser;
  children: React.ReactNode;
};

export function AppShell({ admin, children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background">
      <div className="flex min-h-screen w-full max-w-full min-w-0 overflow-x-clip">
        <Sidebar />
        <div className="flex w-full max-w-full min-w-0 flex-1 flex-col overflow-x-clip">
          <header className="sticky top-0 z-20 border-b border-zinc-900 bg-[#0B0B0B] text-white shadow-sm">
            <div className="grid h-14 w-full max-w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4 md:px-6">
              <div className="min-w-0">
                <MobileNav />
              </div>
              <BrandLogo className="min-w-0 lg:hidden" priority />
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
                    className="h-10 border-white/20 bg-white/5 px-2.5 text-white hover:bg-white/10 hover:text-white max-[390px]:w-10 max-[390px]:px-0"
                    aria-label="Esci"
                  >
                    <LogOut aria-hidden="true" className="size-4 min-[391px]:mr-2" />
                    <span className="sr-only min-[391px]:not-sr-only">Esci</span>
                  </Button>
                </form>
              </div>
            </div>
          </header>
          <main className="w-full max-w-full min-w-0 flex-1 overflow-x-clip px-4 py-5 sm:px-4 sm:py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-clip">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
