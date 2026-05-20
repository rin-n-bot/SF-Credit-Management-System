import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creditService } from '../../services/credit.service';
import { customerService } from '../../services/customer.service';
import { paymentService } from '../../services/payment.service';
import { formatDate, peso, toMoney } from '../../utils/format';
import type { Credit, Customer, Payment } from '../../types/models';
import './styles.css';

interface PaymentGroup {
  groupId: string;
  customerId: number | null;
  customer: Customer | null;
  payDate: string | Date;
  totalPaid: number;
  payments: Payment[];
  appliedCreditIds: number[];
}

function getPaymentDateKey(payDate: string | Date) {
  return new Date(payDate).toISOString().slice(0, 10);
}

export default function PaymentsPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');

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

  const creditMap = useMemo(() => {
    return new Map(credits.map((credit) => [credit.credit_id, credit]));
  }, [credits]);

  const paymentGroups = useMemo(() => {
    const groups = new Map<string, PaymentGroup>();

    payments.forEach((payment) => {
      const credit = creditMap.get(payment.credit_id);
      const customerId = payment.customer_id || credit?.customer_id || null;
      const dateKey = getPaymentDateKey(payment.pay_date);
      const groupId = `${customerId || 'unknown'}-${dateKey}`;
      const existingGroup = groups.get(groupId);

      if (existingGroup) {
        existingGroup.totalPaid += toMoney(payment.amount_paid);
        existingGroup.payments.push(payment);

        if (payment.credit_id && !existingGroup.appliedCreditIds.includes(payment.credit_id)) {
          existingGroup.appliedCreditIds.push(payment.credit_id);
        }

        return;
      }

      groups.set(groupId, {
        groupId,
        customerId,
        customer: customerId ? customerMap.get(customerId) || null : null,
        payDate: payment.pay_date,
        totalPaid: toMoney(payment.amount_paid),
        payments: [payment],
        appliedCreditIds: payment.credit_id ? [payment.credit_id] : [],
      });
    });

    return Array.from(groups.values()).sort((a, b) => {
      const dateDiff = new Date(b.payDate).getTime() - new Date(a.payDate).getTime();

      if (dateDiff !== 0) return dateDiff;

      const latestPaymentA = Math.max(...a.payments.map((payment) => payment.payment_id));
      const latestPaymentB = Math.max(...b.payments.map((payment) => payment.payment_id));

      return latestPaymentB - latestPaymentA;
    });
  }, [creditMap, customerMap, payments]);

  const totalPayments = useMemo(() => {
    return paymentGroups.reduce((sum, group) => sum + group.totalPaid, 0);
  }, [paymentGroups]);

  const uniqueCustomerCount = useMemo(() => {
    return new Set(
      paymentGroups
        .map((group) => group.customerId)
        .filter((customerId): customerId is number => Boolean(customerId)),
    ).size;
  }, [paymentGroups]);

  const latestPaymentGroup = paymentGroups[0];

  const filteredPaymentGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return paymentGroups.filter((group) => {
      const paymentCodes = group.payments
        .map((payment) => `PAY-${String(payment.payment_id).padStart(5, '0')}`)
        .join(' ');
      const creditCodes = group.appliedCreditIds
        .map((creditId) => `CR-${String(creditId).padStart(5, '0')}`)
        .join(' ');

      const matchesCustomer =
        customerFilter === 'All' || String(group.customerId || '') === customerFilter;

      const matchesSearch =
        !keyword ||
        paymentCodes.toLowerCase().includes(keyword) ||
        creditCodes.toLowerCase().includes(keyword) ||
        group.customer?.name.toLowerCase().includes(keyword) ||
        group.customer?.contact_no.toLowerCase().includes(keyword) ||
        formatDate(group.payDate).toLowerCase().includes(keyword);

      return matchesCustomer && matchesSearch;
    });
  }, [customerFilter, paymentGroups, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Review all customer payment records.</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card success">
          <span>Total Payments</span>
          <strong>{peso(totalPayments)}</strong>
        </div>

        <div className="metric-card primary">
          <span>Payment Records</span>
          <strong>{paymentGroups.length}</strong>
        </div>

        <div className="metric-card">
          <span>Customers Paid</span>
          <strong>{uniqueCustomerCount}</strong>
        </div>

        <div className="metric-card">
          <span>Latest Payment</span>
          <strong>{latestPaymentGroup ? peso(latestPaymentGroup.totalPaid) : peso(0)}</strong>
          <small>{latestPaymentGroup ? formatDate(latestPaymentGroup.payDate) : 'No records'}</small>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div>
            <h2>Payment Records</h2>
            <p className="record-count">
              Showing {filteredPaymentGroups.length} of {paymentGroups.length} records
            </p>
          </div>

          <div className="transaction-filters">
            <input
              className="filter-search"
              placeholder="Search payment, credit, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="filter-select"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="All">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment Records</th>
                <th>Applied To</th>
                <th>Total Paid</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPaymentGroups.map((group) => (
                <tr key={group.groupId}>
                  <td>{formatDate(group.payDate)}</td>
                  <td>{group.customer?.name || 'Unknown'}</td>
                  <td>
                    <span className="muted-text">
                      {group.payments
                        .map((payment) => `PAY-${String(payment.payment_id).padStart(5, '0')}`)
                        .join(', ')}
                    </span>
                  </td>
                  <td>
                    <span className="muted-text">
                      {group.appliedCreditIds.length > 0
                        ? group.appliedCreditIds
                            .map((creditId) => `CR-${String(creditId).padStart(5, '0')}`)
                            .join(', ')
                        : 'Unknown'}
                    </span>
                  </td>
                  <td>{peso(group.totalPaid)}</td>
                  <td>
                    <button
                      className="row-action"
                      type="button"
                      disabled={!group.customerId}
                      onClick={() => {
                        if (!group.customerId) return;
                        navigate(`/customers/${group.customerId}`);
                      }}
                    >
                      View Customer
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPaymentGroups.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No payments found.
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