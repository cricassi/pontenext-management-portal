import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

const setupItems = [
  {
    title: "Autenticazione",
    description: "Supabase Auth collegata alla tabella admin_users.",
  },
  {
    title: "Route protette",
    description: "Middleware e layout admin richiedono un amministratore attivo.",
  },
  {
    title: "Schema M0",
    description: "Migration minima admin_users con RLS iniziale.",
  },
  {
    title: "Moduli futuri",
    description: "CRUD, dashboard completa, sponsor, eventi, email e report restano fuori M0.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Setup infrastruttura"
        description="Stato base della milestone M0 e fondazione amministrativa protetta."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {setupItems.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perimetro M0</CardTitle>
          <CardDescription>
            Questa pagina non include KPI, CRUD o funzioni operative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            La milestone consegna solo il progetto avviabile, il login, la
            protezione delle route amministrative, la configurazione Supabase e
            la struttura base per proseguire con le milestone successive.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
