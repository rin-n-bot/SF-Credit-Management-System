import { formatDate, peso } from '../../../utils/format';
import type { Payment } from '../../../types/models';

interface Props {
  sortedPayments: Payment[];
}

export default function PaymentHistoryTable({ sortedPayments }: Props) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-[18px]">
      <div className="flex justify-between items-center mb-3.5 gap-3">
        <h2 className="m-0 text-sm font-extrabold">Payment History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Payment ID', 'Date', 'Applied To', 'Amount'].map((th) => (
                <th
                  key={th}
                  className="px-1.5 py-2 border-b border-[#edf0f5] text-left text-xs text-[var(--color-text-muted)] font-extrabold"
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedPayments.map((payment) => (
              <tr key={payment.payment_id}>
                <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                  PAY-{String(payment.payment_id).padStart(5, '0')}
                </td>
                <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                  {formatDate(payment.pay_date)}
                </td>
                <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                  CR-{String(payment.credit_id).padStart(5, '0')}
                </td>
                <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                  {peso(payment.amount_paid)}
                </td>
              </tr>
            ))}

            {sortedPayments.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-[var(--color-text-light)] py-7 px-1.5 text-sm">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}