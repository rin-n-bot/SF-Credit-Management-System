import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { paymentService } from '../../services/payment.service';
import { toMoney, todayInputValue } from '../../utils/format';
import type { Credit, CreditDetail, CreditItemDraft, Customer, Payment } from '../../types/models';

import AccountSummaryCards from './components/AccountSummaryCards';
import CreditTable from './components/CreditTable';
import PaymentHistoryTable from './components/PaymentHistoryTable';
import AddCreditModal from './components/AddCreditModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import { useBreadcrumb } from '../../context/breadcrumbContext';

const emptyCreditItem: CreditItemDraft = { item_name: '', quantity: 1, price: 0 };

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

export default function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const parsedCustomerId = Number(customerId);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditDetailsById, setCreditDetailsById] = useState<Record<number, CreditDetail[]>>({});
  const [expandedCreditId, setExpandedCreditId] = useState<number | null>(null);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notice, setNotice] = useState('');
  const { setCustomLabel } = useBreadcrumb();

  const [creditForm, setCreditForm] = useState({
    trans_date: todayInputValue(),
    due_date: todayInputValue(),
  });

  const [creditItems, setCreditItems] = useState<CreditItemDraft[]>([{ ...emptyCreditItem }]);

  const [paymentForm, setPaymentForm] = useState({
    pay_date: todayInputValue(),
    amount_paid: '',
  });

  const loadCustomerAccount = useCallback(async () => {
    const [customerRows, creditRows, paymentRows] = await Promise.all([
      customerService.getAll(),
      creditService.getByCustomer(parsedCustomerId),
      paymentService.getAll(),
    ]);

    setCustomer(customerRows.find((row) => row.customer_id === parsedCustomerId) || null);
    setCredits(creditRows);
    setPayments(paymentRows.filter((payment) => payment.customer_id === parsedCustomerId));
  }, [parsedCustomerId]);

  useEffect(() => {
    if (!parsedCustomerId) return;

    let isMounted = true;

    async function loadMountedData() {
      const [customerRows, creditRows, paymentRows] = await Promise.all([
        customerService.getAll(),
        creditService.getByCustomer(parsedCustomerId),
        paymentService.getAll(),
      ]);

      if (!isMounted) return;

      setCustomer(customerRows.find((row) => row.customer_id === parsedCustomerId) || null);
      setCredits(creditRows);
      setPayments(paymentRows.filter((payment) => payment.customer_id === parsedCustomerId));
    }

    loadMountedData();

    return () => {
      isMounted = false;
    };
  }, [parsedCustomerId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

useEffect(() => {
  if (customer?.name) setCustomLabel(customer.name);
  return () => setCustomLabel(null);
}, [customer?.name, setCustomLabel]);

  const creditFormTotal = useMemo(() => {
    return creditItems.reduce(
      (sum, item) => sum + toMoney(item.quantity) * toMoney(item.price),
      0,
    );
  }, [creditItems]);

  const oldestUnpaidCreditsFirst = useMemo(() => {
    return [...credits].sort((a, b) => a.credit_id - b.credit_id);
  }, [credits]);

  const accountSummary = useMemo(() => {
    const totalCredits = credits.reduce((sum, credit) => sum + toMoney(credit.total_amount), 0);
    const totalBalance = credits.reduce((sum, credit) => sum + toMoney(credit.remaining_balance), 0);
    const totalPaid = totalCredits - totalBalance;
    const activeCredits = credits.filter((credit) => toMoney(credit.remaining_balance) > 0).length;
    const overdueCredits = credits.filter((credit) => resolveCreditStatus(credit) === 'Overdue').length;

    return { totalCredits, totalBalance, totalPaid, activeCredits, overdueCredits };
  }, [credits]);

  const paymentAmount = toMoney(paymentForm.amount_paid || 0);
  const balanceAfterPayment = Math.max(accountSummary.totalBalance - paymentAmount, 0);
  const isPaymentInvalid = paymentAmount <= 0 || paymentAmount > accountSummary.totalBalance;

  const paymentAllocationPreview = useMemo(() => {
    const unpaidCredits = oldestUnpaidCreditsFirst.filter(
      (credit) => toMoney(credit.remaining_balance) > 0,
    );

    const preview = unpaidCredits.reduce<{
      remainingPayment: number;
      rows: { creditId: number; appliedAmount: number; balanceAfter: number }[];
    }>(
      (currentPreview, credit) => {
        if (currentPreview.remainingPayment <= 0) return currentPreview;

        const creditBalance = toMoney(credit.remaining_balance);
        const appliedAmount = Math.min(currentPreview.remainingPayment, creditBalance);

        return {
          remainingPayment: currentPreview.remainingPayment - appliedAmount,
          rows: [
            ...currentPreview.rows,
            {
              creditId: credit.credit_id,
              appliedAmount,
              balanceAfter: Math.max(creditBalance - appliedAmount, 0),
            },
          ],
        };
      },
      { remainingPayment: paymentAmount, rows: [] },
    );

    return preview.rows;
  }, [paymentAmount, oldestUnpaidCreditsFirst]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) => new Date(b.pay_date).getTime() - new Date(a.pay_date).getTime(),
    );
  }, [payments]);

  function updateCreditItem(index: number, field: keyof CreditItemDraft, value: string) {
    setCreditItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: field === 'item_name' ? value : Number(value) }
          : item,
      ),
    );
  }

  function closeCreditModal() {
    setShowAddCreditModal(false);
    setCreditForm({ trans_date: todayInputValue(), due_date: todayInputValue() });
    setCreditItems([{ ...emptyCreditItem }]);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setPaymentForm({ pay_date: todayInputValue(), amount_paid: '' });
  }

  if (!customer) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <button
          className="border-0 bg-transparent text-[var(--color-text-muted)] text-[11px] font-bold cursor-pointer p-0 mb-[14px] block hover:text-[var(--color-text-dark)]"
          onClick={() => navigate('/customers')}
        >
          ← Back to Customers
        </button>
        <div className="text-center text-[var(--color-text-light)] py-7">
          Customer not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back link */}
      <button
        className="border-0 bg-transparent text-[var(--color-text-muted)] text-[11px] font-bold cursor-pointer p-0 mb-[14px] block hover:text-[var(--color-text-dark)]"
        onClick={() => navigate('/customers')}
      >
        ← Back to Customers
      </button>

      {/* Page header */}
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold">{customer.name}</h1>
          <p className="mt-1.5 mb-0 text-[var(--color-text-muted)] text-base">
            {customer.contact_no} · {customer.address || 'No address'}
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            className="h-[38px] rounded-md px-4 text-xs font-bold cursor-pointer border border-[var(--color-border)] bg-white text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            onClick={() => setShowAddCreditModal(true)}
          >
            Add Credit
          </button>
          <button
            className="h-[38px] rounded-md px-4 text-xs font-medium cursor-pointer border-0 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-55 disabled:cursor-not-allowed"
            onClick={() => setShowPaymentModal(true)}
            disabled={accountSummary.totalBalance <= 0}
          >
            Record Payment
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="bg-[#f4f2ff] border border-[#d8d3ff] rounded-[var(--card-radius)] px-4 py-3 text-[var(--color-primary-hover)] font-bold mb-5">
          {notice}
        </div>
      )}

      {/* Summary cards */}
      <AccountSummaryCards accountSummary={accountSummary} />

      {/* Credit transactions */}
      <div className="mb-[18px]">
        <CreditTable
          credits={credits}
          creditDetailsById={creditDetailsById}
          expandedCreditId={expandedCreditId}
          setExpandedCreditId={setExpandedCreditId}
          setCreditDetailsById={setCreditDetailsById}
          setNotice={setNotice}
        />
      </div>

      {/* Payment history */}
      <PaymentHistoryTable sortedPayments={sortedPayments} />

      {/* Add credit modal */}
      {showAddCreditModal && (
        <AddCreditModal
          customer={customer}
          creditForm={creditForm}
          setCreditForm={setCreditForm}
          creditItems={creditItems}
          setCreditItems={setCreditItems}
          creditFormTotal={creditFormTotal}
          emptyCreditItem={emptyCreditItem}
          updateCreditItem={updateCreditItem}
          closeCreditModal={closeCreditModal}
          loadCustomerAccount={loadCustomerAccount}
          setNotice={setNotice}
        />
      )}

      {/* Record payment modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          customer={customer}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          accountSummary={accountSummary}
          paymentAmount={paymentAmount}
          balanceAfterPayment={balanceAfterPayment}
          isPaymentInvalid={isPaymentInvalid}
          paymentAllocationPreview={paymentAllocationPreview}
          closePaymentModal={closePaymentModal}
          loadCustomerAccount={loadCustomerAccount}
          setNotice={setNotice}
        />
      )}
    </div>
  );
}