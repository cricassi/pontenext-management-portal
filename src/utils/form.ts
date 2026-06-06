export function readRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function readOptionalString(formData: FormData, key: string) {
  const value = readRequiredString(formData, key);
  return value.length > 0 ? value : null;
}

export function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
