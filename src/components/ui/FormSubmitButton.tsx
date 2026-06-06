"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

type FormSubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
};

export function FormSubmitButton({
  children,
  pendingLabel = "Salvataggio...",
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || props.disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
