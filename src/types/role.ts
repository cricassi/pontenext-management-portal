export type Role = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type RoleFormValues = {
  name: string;
  description: string | null;
  isDefault: boolean;
  sortOrder: number;
};
