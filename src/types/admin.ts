export type AdminRole = "super_admin" | "admin";

export type AdminUser = {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status: "active" | "inactive";
};
