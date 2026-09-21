export type VisibilityField = {
  fieldKey: string;
  formKey: string;
  label: string;
  description: string;
  isRequired: boolean;
  configurable: boolean;
  defaultVisible: true;
  displayOrder: number;
};

export type VisibilityScreen = {
  module: string;
  label: string;
  route: string;
  integrated: boolean;
  fields: readonly VisibilityField[];
};

export type FieldVisibilityRow = {
  id: string;
  screen_key: string;
  field_key: string;
  is_visible: boolean;
  updated_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type ResolvedVisibilityField = VisibilityField & {
  isVisible: boolean;
  hasOverride: boolean;
};

export type ResolvedVisibilityScreen = Omit<VisibilityScreen, "fields"> & {
  screenKey: string;
  fields: ResolvedVisibilityField[];
  updatedAt: string | null;
};

export type VisibilitySnapshot = {
  screens: ResolvedVisibilityScreen[];
  warning: "unavailable" | "invalid_overrides" | null;
};

export type VisibilityActionResult = {
  ok: boolean;
  message: string;
};
