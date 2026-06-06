"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  isSupabaseConfigured: boolean;
  nextPath: string;
};

export function LoginForm({ isSupabaseConfigured, nextPath }: LoginFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setErrorMessage("Configura le variabili Supabase prima di accedere.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setIsSubmitting(false);
      setErrorMessage("Credenziali non valide o utente non autorizzato.");
      return;
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", data.user.id)
      .eq("status", "active")
      .is("archived_at", null)
      .maybeSingle();

    setIsSubmitting(false);

    if (!admin) {
      await supabase.auth.signOut();
      setErrorMessage("Utente non autorizzato o amministratore non attivo.");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Accedi con un account Supabase Auth associato a `admin_users`.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseConfigured ? (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Supabase non risulta configurato. Copia `.env.example` in
            `.env.local` e valorizza URL e anon key.
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(errorMessage)}
            />
            </Field>

            <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(errorMessage)}
            />
            </Field>

            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
              {isSubmitting ? "Accesso in corso..." : "Accedi"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
