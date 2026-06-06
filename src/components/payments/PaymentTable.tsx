import { Archive } from "lucide-react";
import { archivePaymentAction } from "@/app/(admin)/memberships/actions";
import { PaymentMethodBadge } from "@/components/payments/PaymentMethodBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Payment } from "@/types/payment";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type PaymentTableProps = {
  membershipId: string;
  payments: Payment[];
};

export function PaymentTable({ membershipId, payments }: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="Nessun pagamento registrato"
        description="Registra un versamento collegato a questa iscrizione."
      />
    );
  }

  return (
    <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Importo</th>
            <th className="px-4 py-3 font-medium">Metodo</th>
            <th className="px-4 py-3 font-medium">Riferimento</th>
            <th className="px-4 py-3 text-right font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(payment.paymentDate)}
              </td>
              <td className="px-4 py-3 font-medium">
                {formatCurrency(payment.amount)}
              </td>
              <td className="px-4 py-3">
                <PaymentMethodBadge method={payment.method} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {payment.reference ?? "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <form
                    action={archivePaymentAction.bind(
                      null,
                      membershipId,
                      payment.id,
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Archivia pagamento del ${formatDate(payment.paymentDate)}`}
                    >
                      <Archive aria-hidden="true" className="size-4" />
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
