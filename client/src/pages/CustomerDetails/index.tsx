import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApi } from '../../electron/client';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { paymentService } from '../../services/payment.service';
import { formatDate, peso, toMoney, todayInputValue } from '../../utils/format';
import type { Credit, CreditDetail, CreditItemDraft, Customer, Payment } from '../../types/models';
import './styles.css';

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

function getStatusClassName(status: string) {
  if (status === 'Paid') return 'badge paid';
  if (status === 'Partially Paid') return 'badge partial';
  if (status === 'Overdue') return 'badge overdue';
  return 'badge active';
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
      rows: {
        creditId: number;
        appliedAmount: number;
        balanceAfter: number;
      }[];
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
      {
        remainingPayment: paymentAmount,
        rows: [],
      },
    );

    return preview.rows;
  }, [paymentAmount, oldestUnpaidCreditsFirst]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) => new Date(b.pay_date).getTime() - new Date(a.pay_date).getTime(),
    );
  }, [payments]);

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

  if (!customer) {
    return (
      <div className="page customer-details-page">
        <button className="back-link" onClick={() => navigate('/customers')}>
          ← Back to Customers
        </button>
        <div className="empty">Customer not found.</div>
      </div>
    );
  }

  return (
    <div className="page customer-details-page">
      <button className="back-link" onClick={() => navigate('/customers')}>
        ← Back to Customers
      </button>

      <div className="page-header">
        <div>
          <h1>{customer.name}</h1>
          <p>{customer.contact_no} · {customer.address || 'No address'}</p>
        </div>

        <div className="hero-actions">
          <button className="btn-outline" onClick={() => setShowAddCreditModal(true)}>
            Add Credit
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowPaymentModal(true)}
            disabled={accountSummary.totalBalance <= 0}
          >
            Record Payment
          </button>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="metric-grid">
        <div className="metric-card danger">
          <span>Total Balance</span>
          <strong>{peso(accountSummary.totalBalance)}</strong>
        </div>
        <div className="metric-card success">
          <span>Total Paid</span>
          <strong>{peso(accountSummary.totalPaid)}</strong>
        </div>
        <div className="metric-card primary">
          <span>Total Credits</span>
          <strong>{peso(accountSummary.totalCredits)}</strong>
        </div>
        <div className={accountSummary.overdueCredits > 0 ? 'metric-card danger' : 'metric-card'}>
          <span>Active Credits</span>
          <strong>{accountSummary.activeCredits}</strong>
          <small>{accountSummary.overdueCredits} overdue</small>
        </div>
      </div>

      <div className="content-card" style={{ marginBottom: 18 }}>
        <div className="content-card-header">
          <h2>Credit Transactions</h2>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Credit ID</th>
                <th>Transaction Date</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Remaining Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {credits.map((credit) => {
                const isExpanded = expandedCreditId === credit.credit_id;
                const creditItemsForRow = creditDetailsById[credit.credit_id] || [];
                const status = resolveCreditStatus(credit);

                return (
                  <Fragment key={credit.credit_id}>
                    <tr className={`${isExpanded ? 'row-selected' : ''} ${status === 'Overdue' ? 'overdue-row' : ''}`}>
                      <td>CR-{String(credit.credit_id).padStart(5, '0')}</td>
                      <td>{formatDate(credit.trans_date)}</td>
                      <td>{formatDate(credit.due_date)}</td>
                      <td>{peso(credit.total_amount)}</td>
                      <td>{peso(getCreditPaidAmount(credit))}</td>
                      <td className={toMoney(credit.remaining_balance) > 0 ? 'balance-due' : ''}>
                        {peso(credit.remaining_balance)}
                      </td>
                      <td>
                        <span className={getStatusClassName(status)}>{status}</span>
                      </td>
                      <td>
                        <button className="row-action" onClick={() => toggleCreditItems(credit.credit_id)}>
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="row-expanded">
                        <td colSpan={8}>
                          <div className="expanded-details">
                            <div className="content-card">
                              <h3 className="expanded-card-title">Items</h3>
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {creditItemsForRow.map((detail, index) => (
                                    <tr key={detail.detail_id}>
                                      <td>{index + 1}</td>
                                      <td>{detail.item_name}</td>
                                      <td>{detail.quantity}</td>
                                      <td>{peso(detail.price)}</td>
                                      <td>{peso(toMoney(detail.quantity) * toMoney(detail.price))}</td>
                                    </tr>
                                  ))}
                                  {creditItemsForRow.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="empty">
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
                  <td colSpan={8} className="empty">
                    No credit transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2>Payment History</h2>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Applied To</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td>PAY-{String(payment.payment_id).padStart(5, '0')}</td>
                  <td>{formatDate(payment.pay_date)}</td>
                  <td>CR-{String(payment.credit_id).padStart(5, '0')}</td>
                  <td>{peso(payment.amount_paid)}</td>
                </tr>
              ))}

              {sortedPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddCreditModal && (
        <div className="modal-backdrop">
          <div className="wide-modal">
            <div className="modal-header">
              <h2>Add Credit</h2>
              <button type="button" onClick={closeCreditModal}>x</button>
            </div>

            <form onSubmit={handleAddCredit}>
              <div className="form-grid">
                <label>
                  Transaction Date
                  <input
                    type="date"
                    value={creditForm.trans_date}
                    onChange={(e) => setCreditForm({ ...creditForm, trans_date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Due Date
                  <input
                    type="date"
                    value={creditForm.due_date}
                    onChange={(e) => setCreditForm({ ...creditForm, due_date: e.target.value })}
                    required
                  />
                </label>
              </div>

              <h3 className="form-section-title">Items</h3>

              <div className="item-editor">
                {creditItems.map((item, index) => (
                  <div className="item-row" key={index}>
                    <input
                      placeholder="Item name"
                      value={item.item_name}
                      onChange={(e) => updateCreditItem(index, 'item_name', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCreditItem(index, 'quantity', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateCreditItem(index, 'price', e.target.value)}
                      required
                    />
                    <strong>{peso(toMoney(item.quantity) * toMoney(item.price))}</strong>
                    <button
                      type="button"
                      className="remove-item"
                      disabled={creditItems.length === 1}
                      onClick={() =>
                        setCreditItems((currentItems) =>
                          currentItems.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="btn-outline add-item-btn"
                type="button"
                onClick={() => setCreditItems((currentItems) => [...currentItems, { ...emptyCreditItem }])}
              >
                + Add Item
              </button>

              <div className="credit-total">
                <span>Total Amount</span>
                <strong>{peso(creditFormTotal)}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeCreditModal}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button type="button" onClick={closePaymentModal}>x</button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <label>
                Customer
                <input value={customer.name} disabled />
              </label>
              <label>
                Payment Date
                <input
                  type="date"
                  value={paymentForm.pay_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, pay_date: e.target.value })}
                  required
                />
              </label>
              <label>
                Amount Paid
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                  required
                />
              </label>

              <div className="payment-preview">
                <div>
                  <span>Current Balance</span>
                  <strong>{peso(accountSummary.totalBalance)}</strong>
                </div>
                <div>
                  <span>Amount Paid</span>
                  <strong>{peso(paymentAmount)}</strong>
                </div>
                <div>
                  <span>Balance After Payment</span>
                  <strong>{peso(balanceAfterPayment)}</strong>
                </div>
              </div>

              {paymentAmount > accountSummary.totalBalance && (
                <p className="form-error">Payment cannot exceed the customer balance.</p>
              )}

              {paymentAllocationPreview.length > 0 && (
                <div className="allocation-preview">
                  <h3>Payment Allocation</h3>
                  {paymentAllocationPreview.map((row) => (
                    <div className="allocation-row" key={row.creditId}>
                      <span>CR-{String(row.creditId).padStart(5, '0')}</span>
                      <span>{peso(row.appliedAmount)}</span>
                      <small>Remaining: {peso(row.balanceAfter)}</small>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closePaymentModal}>Cancel</button>
                <button type="submit" disabled={isPaymentInvalid}>Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}