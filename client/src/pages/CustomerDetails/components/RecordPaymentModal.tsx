import type { FormEvent } from 'react';
import { paymentService } from '../../../services/payment.service';
import { peso } from '../../../utils/format';
import type { Customer } from '../../../types/models';

interface AllocationRow {
  creditId: number;
  appliedAmount: number;
  balanceAfter: number;
}

interface AccountSummary {
  totalBalance: number;
}

interface Props {
  customer: Customer;
  paymentForm: { pay_date: string; amount_paid: string };
  setPaymentForm: React.Dispatch<React.SetStateAction<{ pay_date: string; amount_paid: string }>>;
  accountSummary: AccountSummary;
  paymentAmount: number;
  balanceAfterPayment: number;
  isPaymentInvalid: boolean;
  paymentAllocationPreview: AllocationRow[];
  closePaymentModal: () => void;
  loadCustomerAccount: () => Promise<void>;
  setNotice: (msg: string) => void;
}

export default function RecordPaymentModal({
  customer,
  paymentForm,
  setPaymentForm,
  accountSummary,
  paymentAmount,
  balanceAfterPayment,
  isPaymentInvalid,
  paymentAllocationPreview,
  closePaymentModal,
  loadCustomerAccount,
  setNotice,
}: Props) {
  async function handleRecordPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!customer) return;

    if (accountSummary.totalBalance <= 0) {
      setNotice('This customer has no remaining balance.');
      return;
    }

    if (isPaymentInvalid) {
      setNotice('Payment must be greater than zero and cannot exceed the current balance.');
      return;
    }

    try {
      await paymentService.payCustomerBalance(
        customer.customer_id,
        paymentAmount,
        paymentForm.pay_date,
      );

      setNotice('Payment recorded successfully.');
      closePaymentModal();
      await loadCustomerAccount();
    } catch (error) {
      console.error(error);
      setNotice('Failed to record payment.');
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.48)] grid place-items-center z-[100]">
      <div className="bg-white rounded-lg shadow-[0_24px_60px_rgba(15,23,42,0.22)] w-[440px] max-w-[92vw] p-6">

        {/* Header */}
        <div className="flex justify-between gap-4 mb-[18px]">
          <h2 className="m-0 text-[#12172a] text-md font-black">Record Payment</h2>
          <button
            type="button"
            className="border-0 bg-transparent cursor-pointer text-2xl leading-none font-medium"
            onClick={closePaymentModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRecordPayment} className="flex flex-col gap-3.5">

          {/* Customer */}
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Customer
            <input
              value={customer.name}
              disabled
              className="border border-[var(--color-border)] rounded-md p-2.5 text-[13px]"
            />
          </label>

          {/* Payment date */}
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Payment Date
            <input
              type="date"
              value={paymentForm.pay_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, pay_date: e.target.value })}
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
            />
          </label>

          {/* Amount paid */}
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Amount Paid
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={paymentForm.amount_paid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
            />
          </label>

          {/* Payment preview */}
          <div className="grid gap-2 p-3 border border-[var(--color-border)] rounded-lg bg-[#fafbff]">
            <div className="flex justify-between gap-3 items-center">
              <span className="text-[var(--color-text-muted)] text-xs font-extrabold">Current Balance</span>
              <strong className="text-xs font-black">{peso(accountSummary.totalBalance)}</strong>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <span className="text-[var(--color-text-muted)] text-xs font-extrabold">Amount Paid</span>
              <strong className="text-xs font-black">{peso(paymentAmount)}</strong>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <span className="text-[var(--color-text-muted)] text-xs font-extrabold">Balance After Payment</span>
              <strong className="text-sm text-[var(--color-accent)]">{peso(balanceAfterPayment)}</strong>
            </div>
          </div>

          {/* Overpayment error */}
          {paymentAmount > accountSummary.totalBalance && (
            <p className="m-0 text-[var(--color-error)] text-xs font-extrabold">
              Payment cannot exceed the customer balance.
            </p>
          )}

          {/* Allocation preview */}
          {paymentAllocationPreview.length > 0 && (
            <div className="border border-[var(--color-border)] rounded-lg p-3">
              <h3 className="m-0 mb-2.5 text-xs font-black">Payment Allocation</h3>
              {paymentAllocationPreview.map((row) => (
                <div
                  key={row.creditId}
                  className="flex justify-between gap-3 items-center py-2 border-t border-[var(--color-border)] first:border-t-0"
                >
                  <span className="text-xs font-black">
                    CR-{String(row.creditId).padStart(5, '0')}
                  </span>
                  <span className="text-xs font-black">{peso(row.appliedAmount)}</span>
                  <small className="text-[var(--color-text-muted)] text-xs font-extrabold">
                    Remaining: {peso(row.balanceAfter)}
                  </small>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2.5 mt-2">
            <button
              type="button"
              onClick={closePaymentModal}
              className="h-9 rounded-md px-4 cursor-pointer text-xs font-bold bg-white border border-[var(--color-border)] hover:text-[var(--color-primary-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPaymentInvalid}
              className="h-9 rounded-md px-4 cursor-pointer text-xs font-bold bg-[var(--color-primary)] border-0 text-white disabled:opacity-55 disabled:cursor-not-allowed hover:bg-[var(--color-primary-hover)]"
            >
              Save Payment
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}