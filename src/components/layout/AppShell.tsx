import { signOutAction } from "@/app/(admin)/actions";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import type { AdminUser } from "@/types/admin";

type AppShellProps = {
  admin: AdminUser;
  children: React.ReactNode;
};

export function AppShell({ admin, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
              <MobileNav />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{admin.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                </p>
              </div>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Esci
                </Button>
              </form>
            </div>
          </header>
          <Separator />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
