import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { paymentService } from '../../services/payment.service';
import { formatDate, peso, toMoney } from '../../utils/format';
import type { Credit, Customer, Payment } from '../../types/models';
import AppLayout from '../../layout/AppLayout';
import SummaryCard from '../../components/SummaryCard';
import ActivityTable from './components/ActivityTable';

function isCreditOverdue(credit: Credit) {
  const remainingBalance = toMoney(credit.remaining_balance);
  const dueDate = new Date(credit.due_date);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return remainingBalance > 0 && dueDate < today;
}

function isCurrentMonth(dateValue: string | Date) {
  const date = new Date(dateValue);
  const today = new Date();

  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
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

    loadDashboard();

    return () => { mounted = false; };
  }, []);

  const customerMap = useMemo(() => {
    return new Map(customers.map((customer) => [customer.customer_id, customer]));
  }, [customers]);

  const creditMap = useMemo(() => {
    return new Map(credits.map((credit) => [credit.credit_id, credit]));
  }, [credits]);

  const dashboardSummary = useMemo(() => {
    const totalOutstandingBalance = credits.reduce(
      (sum, credit) => sum + toMoney(credit.remaining_balance),
      0,
    );

    const totalPaymentsCollected = payments.reduce(
      (sum, payment) => sum + toMoney(payment.amount_paid),
      0,
    );

    const monthPaymentsCollected = payments
      .filter((payment) => isCurrentMonth(payment.pay_date))
      .reduce((sum, payment) => sum + toMoney(payment.amount_paid), 0);

    const monthCreditsAdded = credits
      .filter((credit) => isCurrentMonth(credit.trans_date))
      .reduce((sum, credit) => sum + toMoney(credit.total_amount), 0);

    const overdueCredits = credits.filter(isCreditOverdue).length;

    return {
      totalCustomers: customers.length,
      totalOutstandingBalance,
      totalPaymentsCollected,
      monthPaymentsCollected,
      monthCreditsAdded,
      overdueCredits,
    };
  }, [credits, customers.length, payments]);

  const recentCredits = useMemo(() => {
    return [...credits]
      .sort((a, b) => new Date(b.trans_date).getTime() - new Date(a.trans_date).getTime())
      .slice(0, 5);
  }, [credits]);

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => {
        const dateDiff = new Date(b.pay_date).getTime() - new Date(a.pay_date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.payment_id - a.payment_id;
      })
      .slice(0, 5);
  }, [payments]);

  const topUnpaidCustomers = useMemo(() => {
    return [...customers]
      .map((customer) => {
        const balance = credits
          .filter((credit) => credit.customer_id === customer.customer_id)
          .reduce((sum, credit) => sum + toMoney(credit.remaining_balance), 0);

        return { ...customer, balance };
      })
      .filter((customer) => customer.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [credits, customers]);

  function getPaymentCustomer(payment: Payment) {
    if (payment.customer_id) {
      return customerMap.get(payment.customer_id) || null;
    }

    const credit = creditMap.get(payment.credit_id);
    if (!credit) return null;

    return customerMap.get(credit.customer_id) || null;
  }

  return (
    <AppLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#12172a]">Dashboard</h1>
          <p className="mt-[6px] mb-0 text-[#5f667a] text-sm">
            Welcome back, {user?.full_name || 'Admin User'}.
          </p>
          <p className="mt-[6px] mb-0 text-[#5f667a] text-sm">
            Here's what's happening with your store today.
          </p>
        </div>

        <div className="flex gap-[18px] text-[#6b7280] text-xs items-center">
          <span>
            {new Date().toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <strong className="text-[#12172a]">{user?.username || 'Owner'}</strong>
        </div>
      </div>

      {/* ── Overview ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold tracking-[0.07em] uppercase text-[#5f667a] m-0 mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-4 gap-[18px] max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
          <SummaryCard
            label="Total Customers"
            value={dashboardSummary.totalCustomers}
            sub="All customers"
          />
          <SummaryCard
            label="Overdue Credits"
            value={dashboardSummary.overdueCredits}
            sub="Need follow-up"
            variant="warning"
          />
          <SummaryCard
            label="Outstanding Balance"
            value={peso(dashboardSummary.totalOutstandingBalance)}
            sub="Total unpaid"
            variant="danger"
          />
          <SummaryCard
            label="Total Payments Collected"
            value={peso(dashboardSummary.totalPaymentsCollected)}
            sub="All-time received"
            variant="success"
          />
        </div>
      </section>

      {/* ── This Month ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold tracking-[0.07em] uppercase text-[#5f667a] m-0 mb-4">
          This Month
        </h2>
        <div className="grid grid-cols-2 gap-[18px] max-[760px]:grid-cols-1">
          <SummaryCard
            label="New Credits This Month"
            value={peso(dashboardSummary.monthCreditsAdded)}
            sub="Credits added this month"
            variant="primary"
          />
          <SummaryCard
            label="Collected This Month"
            value={peso(dashboardSummary.monthPaymentsCollected)}
            sub="Payments received this month"
            variant="success"
          />
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold tracking-[0.07em] uppercase text-[#5f667a] m-0 mb-4">
          Recent Activity
        </h2>
        <div className="grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
          <ActivityTable
            title="Recent Credits"
            columns={[
              { label: 'Customer', render: (credit) => customerMap.get(credit.customer_id)?.name || 'Unknown' },
              { label: 'Date', render: (credit) => formatDate(credit.trans_date) },
              { label: 'Amount', render: (credit) => peso(credit.total_amount) },
            ]}
            rows={recentCredits}
            keyExtractor={(credit) => credit.credit_id}
            emptyMessage="No credit records yet."
            onViewAll={() => navigate('/transactions')}
          />

          <ActivityTable
            title="Recent Payments"
            columns={[
              { label: 'Customer', render: (payment) => getPaymentCustomer(payment)?.name || 'Unknown' },
              { label: 'Date', render: (payment) => formatDate(payment.pay_date) },
              { label: 'Amount', render: (payment) => peso(payment.amount_paid) },
            ]}
            rows={recentPayments}
            keyExtractor={(payment) => payment.payment_id}
            emptyMessage="No payment records yet."
            onViewAll={() => navigate('/payments')}
          />

          <ActivityTable
            title="Top Unpaid Customers"
            columns={[
              { label: 'Customer', render: (customer) => customer.name },
              { label: 'Balance', render: (customer) => peso(customer.balance) },
            ]}
            rows={topUnpaidCustomers}
            keyExtractor={(customer) => customer.customer_id}
            emptyMessage="No unpaid balances."
            onViewAll={() => navigate('/customers')}
          />
        </div>
      </section>
    </AppLayout>
  );
}