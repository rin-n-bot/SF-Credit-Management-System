import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApi } from '../../electron/client';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { paymentService } from '../../services/payment.service';
import { formatDate, peso, toMoney } from '../../utils/format';
import type { Credit, CreditDetail, Customer, Payment } from '../../types/models';
import './styles.css';

type StatusFilter = 'All' | 'Active' | 'Partially Paid' | 'Paid' | 'Overdue';

export default function TransactionPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditDetails, setCreditDetails] = useState<Record<number, CreditDetail[]>>({});
  const [expandedCreditId, setExpandedCreditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [customerRows, creditRows, paymentRows] = await Promise.all([
        customerService.getAll(),
        creditService.getAll(),
        paymentService.getAll(),
      ]);

      if (!mounted) return;

      setCustomers(customerRows);
      setCredits(creditRows);
      setPayments(paymentRows);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const customerMap = useMemo(() => {
    return new Map(customers.map((customer) => [customer.customer_id, customer]));
  }, [customers]);

  function getCustomerName(customerId: number) {
    return customerMap.get(customerId)?.name || 'Unknown';
  }

  function getPaidAmount(credit: Credit) {
    return toMoney(credit.total_amount) - toMoney(credit.remaining_balance);
  }

  function getCreditStatus(credit: Credit): StatusFilter {
    const remaining = toMoney(credit.remaining_balance);
    const paid = getPaidAmount(credit);
    const isOverdue = new Date() > new Date(credit.due_date);

    if (remaining <= 0) return 'Paid';
    if (isOverdue) return 'Overdue';
    if (paid > 0 && remaining > 0) return 'Partially Paid';

    return credit.status || 'Active';
  }

  function getCreditPayments(credit: Credit) {
    return payments.filter((payment) => payment.credit_id === credit.credit_id);
  }

  function getStatusClass(status: StatusFilter) {
    if (status === 'Paid') return 'badge paid';
    if (status === 'Partially Paid') return 'badge partial';
    if (status === 'Overdue') return 'badge overdue';
    return 'badge active';
  }

  async function toggleCreditDetails(creditId: number) {
    const nextExpandedId = expandedCreditId === creditId ? null : creditId;
    setExpandedCreditId(nextExpandedId);

    if (!nextExpandedId || creditDetails[creditId]) return;

    try {
      const details = await getApi().creditDetail.getByCredit(creditId);
      setCreditDetails((prev) => ({
        ...prev,
        [creditId]: details,
      }));
    } catch (error) {
      console.error(error);
      setNotice('Failed to load credit details.');
    }
  }

  const totalCredits = credits.reduce((sum, credit) => sum + toMoney(credit.total_amount), 0);
  const totalBalance = credits.reduce((sum, credit) => sum + toMoney(credit.remaining_balance), 0);
  const totalPaid = totalCredits - totalBalance;
  const overdueCount = credits.filter((credit) => getCreditStatus(credit) === 'Overdue').length;

  const keyword = searchTerm.trim().toLowerCase();

  const filteredCredits = credits.filter((credit) => {
    const customer = customerMap.get(credit.customer_id);
    const status = getCreditStatus(credit);
    const creditCode = `CR-${String(credit.credit_id).padStart(5, '0')}`.toLowerCase();

    const matchesSearch =
      !keyword ||
      creditCode.includes(keyword) ||
      String(credit.credit_id).includes(keyword) ||
      customer?.name.toLowerCase().includes(keyword) ||
      customer?.contact_no.toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === 'All' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Audit and review all customer credit transactions.</p>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="metric-grid">
        <div className="metric-card primary">
          <span>Total Credits</span>
          <strong>{peso(totalCredits)}</strong>
        </div>
        <div className="metric-card success">
          <span>Total Paid</span>
          <strong>{peso(totalPaid)}</strong>
        </div>
        <div className="metric-card danger">
          <span>Total Balance</span>
          <strong>{peso(totalBalance)}</strong>
        </div>
        <div className="metric-card">
          <span>Overdue</span>
          <strong>{overdueCount}</strong>
          <small>Credit records</small>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div>
            <h2>All Credit Transactions</h2>
            <p className="record-count">Showing {filteredCredits.length} of {credits.length} records</p>
          </div>

          <div className="transaction-filters">
            <input
              className="filter-search"
              placeholder="Search credit or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option>All</option>
              <option>Active</option>
              <option>Partially Paid</option>
              <option>Paid</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Credit ID</th>
                <th>Customer</th>
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
              {filteredCredits.map((credit) => {
                const isExpanded = expandedCreditId === credit.credit_id;
                const details = creditDetails[credit.credit_id] || [];
                const creditPayments = getCreditPayments(credit);
                const status = getCreditStatus(credit);

                return (
                  <Fragment key={credit.credit_id}>
                    <tr className={isExpanded ? 'row-selected' : ''}>
                      <td>CR-{String(credit.credit_id).padStart(5, '0')}</td>
                      <td>{getCustomerName(credit.customer_id)}</td>
                      <td>{formatDate(credit.trans_date)}</td>
                      <td>{formatDate(credit.due_date)}</td>
                      <td>{peso(credit.total_amount)}</td>
                      <td>{peso(getPaidAmount(credit))}</td>
                      <td>{peso(credit.remaining_balance)}</td>
                      <td>
                        <span className={getStatusClass(status)}>{status}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="row-action"
                            type="button"
                            onClick={() => toggleCreditDetails(credit.credit_id)}
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                          <button
                            className="row-action"
                            type="button"
                            onClick={() => navigate(`/customers/${credit.customer_id}`)}
                          >
                            Customer
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="row-expanded">
                        <td colSpan={9}>
                          <div className="expanded-grid">
                            <div className="content-card">
                              <h3 className="expanded-card-title">Items</h3>

                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {details.map((detail, index) => (
                                    <tr key={detail.detail_id}>
                                      <td>{index + 1}</td>
                                      <td>{detail.item_name}</td>
                                      <td>{detail.quantity}</td>
                                      <td>{peso(detail.price)}</td>
                                      <td>{peso(toMoney(detail.quantity) * toMoney(detail.price))}</td>
                                    </tr>
                                  ))}

                                  {details.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="empty">
                                        No item details found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="content-card">
                              <h3 className="expanded-card-title">Payment History</h3>

                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {creditPayments.map((payment) => (
                                    <tr key={payment.payment_id}>
                                      <td>{formatDate(payment.pay_date)}</td>
                                      <td>{peso(payment.amount_paid)}</td>
                                    </tr>
                                  ))}

                                  {creditPayments.length === 0 && (
                                    <tr>
                                      <td colSpan={2} className="empty">
                                        No payments yet.
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

              {filteredCredits.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    No credit transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}