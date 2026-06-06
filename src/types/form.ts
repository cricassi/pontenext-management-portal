export type FormState = {
  message?: string;
  errors?: Record<string, string>;
};

export const emptyFormState: FormState = {
  errors: {},
};
