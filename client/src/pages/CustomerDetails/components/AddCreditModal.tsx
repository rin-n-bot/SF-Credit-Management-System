import type { FormEvent } from 'react';
import { creditService } from '../../../services/credit.service';
import { peso, toMoney } from '../../../utils/format';
import type { CreditItemDraft, Customer } from '../../../types/models';

interface Props {
  customer: Customer;
  creditForm: { trans_date: string; due_date: string };
  setCreditForm: React.Dispatch<React.SetStateAction<{ trans_date: string; due_date: string }>>;
  creditItems: CreditItemDraft[];
  setCreditItems: React.Dispatch<React.SetStateAction<CreditItemDraft[]>>;
  creditFormTotal: number;
  emptyCreditItem: CreditItemDraft;
  updateCreditItem: (index: number, field: keyof CreditItemDraft, value: string) => void;
  closeCreditModal: () => void;
  loadCustomerAccount: () => Promise<void>;
  setNotice: (msg: string) => void;
}

export default function AddCreditModal({
  customer,
  creditForm,
  setCreditForm,
  creditItems,
  setCreditItems,
  creditFormTotal,
  emptyCreditItem,
  updateCreditItem,
  closeCreditModal,
  loadCustomerAccount,
  setNotice,
}: Props) {
  async function handleAddCredit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validItems = creditItems.filter(
      (item) => item.item_name.trim() && toMoney(item.quantity) > 0 && toMoney(item.price) > 0,
    );

    if (!customer || validItems.length === 0) {
      setNotice('Add at least one valid item.');
      return;
    }

    if (new Date(creditForm.due_date) < new Date(creditForm.trans_date)) {
      setNotice('Due date cannot be earlier than transaction date.');
      return;
    }

    try {
      await creditService.addWithDetails(
        {
          customer_id: customer.customer_id,
          trans_date: creditForm.trans_date,
          due_date: creditForm.due_date,
          total_amount: creditFormTotal,
        },
        validItems,
      );

      setNotice('Credit added successfully.');
      closeCreditModal();
      await loadCustomerAccount();
    } catch (error) {
      console.error(error);
      setNotice('Failed to add credit.');
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.48)] grid place-items-center z-[100]">
      <div className="bg-white rounded-lg shadow-[0_24px_60px_rgba(15,23,42,0.22)] w-[min(1000px,94vw)] max-h-[90vh] overflow-auto p-6">

        {/* Header */}
        <div className="flex justify-between gap-4 mb-[18px]">
          <h2 className="m-0 text-lg font-black">Add Credit</h2>
          <button
            type="button"
            className="border-0 bg-transparent cursor-pointer text-2xl leading-none"
            onClick={closeCreditModal}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAddCredit} className="flex flex-col gap-3.5">

          {/* Date grid */}
          <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
            <label className="flex flex-col gap-1.5 text-xs font-extrabold">
              Transaction Date
              <input
                type="date"
                value={creditForm.trans_date}
                onChange={(e) => setCreditForm({ ...creditForm, trans_date: e.target.value })}
                required
                className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-extrabold">
              Due Date
              <input
                type="date"
                value={creditForm.due_date}
                onChange={(e) => setCreditForm({ ...creditForm, due_date: e.target.value })}
                required
                className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
              />
            </label>
          </div>

          {/* Items title */}
          <h3 className="mt-2.5 mb-0 text-[13px] font-black">Items</h3>

          {/* Item rows */}
          <div className="flex flex-col gap-2">
            {creditItems.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 items-center max-[900px]:grid-cols-1"
                style={{ gridTemplateColumns: '1fr 90px 120px 110px 34px' }}
              >
                <input
                  placeholder="eg. Sardines, Beer, Noodles etc.."
                  value={item.item_name}
                  onChange={(e) => updateCreditItem(index, 'item_name', e.target.value)}
                  required
                  className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateCreditItem(index, 'quantity', e.target.value)}
                  required
                  className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateCreditItem(index, 'price', e.target.value)}
                  required
                  className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[var(--color-primary-hover)] focus:ring-2 focus:ring-white focus:rounded-lg"
                />
                <strong className="text-sm text-right">
                  {peso(toMoney(item.quantity) * toMoney(item.price))}
                </strong>
                <button
                  type="button"
                  disabled={creditItems.length === 1}
                  onClick={() =>
                    setCreditItems((currentItems) =>
                      currentItems.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="h-[34px] border border-[var(--color-border)] bg-white rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          {/* Add item button */}
          <button
            type="button"
            className="w-fit h-[38px] rounded-md px-4 text-[13px] font-extrabold cursor-pointer border border-[var(--color-border)] bg-white text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            onClick={() =>
              setCreditItems((currentItems) => [...currentItems, { ...emptyCreditItem }])
            }
          >
            + Add Item
          </button>

          {/* Total */}
          <div className="flex justify-end gap-4 text-sm">
            <span className="text-[var(--color-text-muted)] font-extrabold">Total Amount</span>
            <strong className="font-black">{peso(creditFormTotal)}</strong>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 mt-2">
            <button
              type="button"
              onClick={closeCreditModal}
              className="h-9 rounded-md px-4 cursor-pointer text-[13px] font-extrabold bg-white border border-[var(--color-border)] hover:text-[var(--color-primary-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 rounded-md px-4 cursor-pointer text-[13px] font-extrabold bg-[var(--color-primary)] border-0 text-white hover:bg-[var(--color-primary-hover)]"
            >
              Save
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}