import { AppShell } from "@/components/layout/AppShell";
import { requireActiveAdmin } from "@/services/admin-auth.service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { admin } = await requireActiveAdmin();

  return <AppShell admin={admin}>{children}</AppShell>;
}
