import { Fragment } from 'react';
import { getApi } from '../../../electron/client';
import { formatDate, peso, toMoney } from '../../../utils/format';
import type { Credit, CreditDetail } from '../../../types/models';

function getCreditPaidAmount(credit: Credit) {
  return toMoney(credit.total_amount) - toMoney(credit.remaining_balance);
}

function resolveCreditStatus(credit: Credit) {
  const paidAmount = getCreditPaidAmount(credit);
  const remainingBalance = toMoney(credit.remaining_balance);
  const dueDate = new Date(credit.due_date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  if (remainingBalance <= 0) return 'Paid';
  if (dueDate < today) return 'Overdue';
  if (paidAmount > 0) return 'Partially Paid';

  return 'Active';
}

function getStatusClasses(status: string) {
  const base = 'inline-block px-2.5 py-1 rounded text-[10px] font-black';
  if (status === 'Paid') return `${base} bg-[#def8e7] text-[#15803d]`;
  if (status === 'Partially Paid') return `${base} bg-[#fff7d6] text-[#a16207]`;
  if (status === 'Overdue') return `${base} bg-[#ffe4e4] text-[#b91c1c]`;
  return `${base} bg-[#eaf2ff] text-[#3155c8]`;
}

interface Props {
  credits: Credit[];
  creditDetailsById: Record<number, CreditDetail[]>;
  expandedCreditId: number | null;
  setExpandedCreditId: (id: number | null) => void;
  setCreditDetailsById: React.Dispatch<React.SetStateAction<Record<number, CreditDetail[]>>>;
  setNotice: (msg: string) => void;
}

export default function CreditTable({
  credits,
  creditDetailsById,
  expandedCreditId,
  setExpandedCreditId,
  setCreditDetailsById,
  setNotice,
}: Props) {
  async function toggleCreditItems(creditId: number) {
    const nextExpandedCreditId = expandedCreditId === creditId ? null : creditId;
    setExpandedCreditId(nextExpandedCreditId);

    if (!nextExpandedCreditId || creditDetailsById[creditId]) return;

    try {
      const details = await getApi().creditDetail.getByCredit(creditId);
      setCreditDetailsById((current) => ({ ...current, [creditId]: details }));
    } catch (error) {
      console.error(error);
      setNotice('Failed to load credit items.');
    }
  }

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-[18px]">
      <div className="flex justify-between items-center mb-3.5 gap-3">
        <h2 className="m-0 text-sm font-extrabold">Credit Transactions</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Credit ID', 'Transaction Date', 'Due Date', 'Total Amount', 'Paid', 'Remaining Balance', 'Status', 'Action'].map((th) => (
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
            {credits.map((credit) => {
              const isExpanded = expandedCreditId === credit.credit_id;
              const creditItemsForRow = creditDetailsById[credit.credit_id] || [];
              const status = resolveCreditStatus(credit);

              return (
                <Fragment key={credit.credit_id}>
                  <tr className={status === 'Overdue' ? 'bg-[#fff7f7]' : isExpanded ? 'bg-[#fafbff]' : ''}>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      CR-{String(credit.credit_id).padStart(5, '0')}
                    </td>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      {formatDate(credit.trans_date)}
                    </td>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      {formatDate(credit.due_date)}
                    </td>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      {peso(credit.total_amount)}
                    </td>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      {peso(getCreditPaidAmount(credit))}
                    </td>
                    <td
                      className={`px-1.5 py-2 border-b border-[#edf0f5] text-sm font-bold ${
                        toMoney(credit.remaining_balance) > 0
                          ? 'text-[var(--color-error)] font-black'
                          : 'text-[var(--color-text-dark)]'
                      }`}
                    >
                      {peso(credit.remaining_balance)}
                    </td>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      <span className={getStatusClasses(status)}>{status}</span>
                    </td>
                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                      <button
                        className="border-0 bg-transparent text-[var(--color-primary)] underline font-extrabold cursor-pointer p-0 text-xs hover:text-[var(--color-primary-hover)] hover:underline"
                        onClick={() => toggleCreditItems(credit.credit_id)}
                      >
                        {isExpanded ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-[#fafbff]">
                      <td colSpan={8} className="p-0 border-b border-[#edf0f5]">
                        <div className="p-5 max-w-[760px] border-b border-[var(--color-border)]">
                          <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-[18px]">
                            <h3 className="m-0 mb-3.5 text-[13px] font-extrabold">Items</h3>
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  {['#', 'Item', 'Qty', 'Price', 'Subtotal'].map((th) => (
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
                                {creditItemsForRow.map((detail, index) => (
                                  <tr key={detail.detail_id}>
                                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">{index + 1}</td>
                                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">{detail.item_name}</td>
                                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">{detail.quantity}</td>
                                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">{peso(detail.price)}</td>
                                    <td className="px-1.5 py-2 border-b border-[#edf0f5] text-xs text-[var(--color-text-dark)] font-medium">
                                      {peso(toMoney(detail.quantity) * toMoney(detail.price))}
                                    </td>
                                  </tr>
                                ))}
                                {creditItemsForRow.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="text-center text-[var(--color-text-light)] py-7 px-1.5">
                                      No item details found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {credits.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-[var(--color-text-light)] py-7 px-1.5 text-sm">
                  No credit transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}