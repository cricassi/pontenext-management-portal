import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/types/admin";

type AdminUserRow = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: AdminUser["role"];
  status: AdminUser["status"];
};

function mapAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
  };
}

export async function getCurrentAdmin() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      user: null,
      admin: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isConfigured: true,
      user: null,
      admin: null,
    };
  }

  const { data } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, full_name, email, role, status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .is("archived_at", null)
    .maybeSingle<AdminUserRow>();

  return {
    isConfigured: true,
    user,
    admin: data ? mapAdminUser(data) : null,
  };
}

export async function requireActiveAdmin() {
  const authState = await getCurrentAdmin();

  if (!authState.isConfigured || !authState.user || !authState.admin) {
    redirect("/login");
  }

  return {
    user: authState.user,
    admin: authState.admin,
  };
}
