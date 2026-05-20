import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { peso, toMoney } from '../../utils/format';
import type { Credit, Customer, CustomerInput } from '../../types/models';
import SummaryCard from '../../components/SummaryCard';
import {
  BalanceFilterSelect,
  CustomersTable,
  CustomerFormModal,
} from './components';
import './styles.css';

const emptyCustomerForm: CustomerInput = { name: '', contact_no: '', address: '' };
type BalanceFilter = 'all' | 'with-balance' | 'paid';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');
  const [sortByHighestBalance, setSortByHighestBalance] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerInput>(emptyCustomerForm);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const [customerRows, creditRows] = await Promise.all([
      customerService.getAll(),
      creditService.getAll(),
    ]);

    setCustomers(customerRows);
    setCredits(creditRows);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMountedData() {
      const [customerRows, creditRows] = await Promise.all([
        customerService.getAll(),
        creditService.getAll(),
      ]);

      if (!mounted) return;

      setCustomers(customerRows);
      setCredits(creditRows);
    }

    loadMountedData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice('');
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const balanceByCustomer = useMemo(() => {
    return credits.reduce<Record<number, number>>((balances, credit) => {
      balances[credit.customer_id] =
        (balances[credit.customer_id] || 0) + toMoney(credit.remaining_balance);

      return balances;
    }, {});
  }, [credits]);

  const creditCountByCustomer = useMemo(() => {
    return credits.reduce<Record<number, number>>((counts, credit) => {
      counts[credit.customer_id] = (counts[credit.customer_id] || 0) + 1;
      return counts;
    }, {});
  }, [credits]);

  const filteredCustomers = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();

    const filtered = customers.filter((customer) => {
      const balance = balanceByCustomer[customer.customer_id] || 0;

      const matchesSearch =
        !kw ||
        customer.name.toLowerCase().includes(kw) ||
        customer.contact_no.toLowerCase().includes(kw) ||
        (customer.address || '').toLowerCase().includes(kw);

      const matchesBalanceFilter =
        balanceFilter === 'all' ||
        (balanceFilter === 'with-balance' && balance > 0) ||
        (balanceFilter === 'paid' && balance <= 0);

      return matchesSearch && matchesBalanceFilter;
    });

    if (!sortByHighestBalance) return filtered;

    return [...filtered].sort(
      (a, b) =>
        (balanceByCustomer[b.customer_id] || 0) - (balanceByCustomer[a.customer_id] || 0),
    );
  }, [balanceByCustomer, balanceFilter, customers, searchTerm, sortByHighestBalance]);

  const summary = useMemo(() => {
    const totalOutstanding = customers.reduce(
      (sum, customer) => sum + (balanceByCustomer[customer.customer_id] || 0),
      0,
    );

    const customersWithBalance = customers.filter(
      (customer) => (balanceByCustomer[customer.customer_id] || 0) > 0,
    ).length;

    return {
      totalCustomers: customers.length,
      customersWithBalance,
      paidCustomers: customers.length - customersWithBalance,
      totalOutstanding,
    };
  }, [balanceByCustomer, customers]);

  function openAddModal() {
    setEditingCustomer(null);
    setCustomerForm(emptyCustomerForm);
    setShowModal(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      contact_no: customer.contact_no,
      address: customer.address || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCustomer(null);
    setCustomerForm(emptyCustomerForm);
  }

  async function handleSaveCustomer(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      if (editingCustomer) {
        await customerService.update({
          ...editingCustomer,
          name: customerForm.name.trim(),
          contact_no: customerForm.contact_no.trim(),
          address: customerForm.address?.trim() || null,
        });

        setNotice('Customer updated successfully.');
      } else {
        await customerService.add({
          name: customerForm.name.trim(),
          contact_no: customerForm.contact_no.trim(),
          address: customerForm.address?.trim() || null,
        });

        setNotice('Customer added successfully.');
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error(error);
      setNotice('Failed to save customer. Check if contact number is already used.');
    }
  }

  async function handleDeleteCustomer(customer: Customer) {
    const customerCreditCount = creditCountByCustomer[customer.customer_id] || 0;

    if (customerCreditCount > 0) {
      setNotice('Customer has credit records. Keep the profile for audit history.');
      return;
    }

    if (!confirm(`Delete ${customer.name}? This can only be done for customers with no records.`)) {
      return;
    }

    try {
      await customerService.delete(customer.customer_id);
      setNotice('Customer deleted.');
      await loadData();
    } catch (error) {
      console.error(error);
      setNotice('Failed to delete customer.');
    }
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Customers</h1>
          <p>Find customers, check balances, and manage their credit.</p>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="customers-summary-grid">
        <SummaryCard label="Total Customers" value={summary.totalCustomers} />
        <SummaryCard label="With Balance" value={summary.customersWithBalance} />
        <SummaryCard label="Paid Customers" value={summary.paidCustomers} />
        <SummaryCard label="Total Outstanding" value={peso(summary.totalOutstanding)} variant="primary" />
      </div>

      <div className="customers-content">
        <div className="customers-content-header">
          <div>
            <h2>All Customers</h2>
            <p className="count">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>

          <div className="actions">
            <input
              className="search"
              placeholder="Search by name, contact, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <BalanceFilterSelect
              value={balanceFilter}
              onChange={(val) => setBalanceFilter(val as BalanceFilter)}
              options={[
                { label: 'All', value: 'all' },
                { label: 'With Balance', value: 'with-balance' },
                { label: 'Paid', value: 'paid' },
              ]}
            />

            <label className="sort-toggle">
              <input
                type="checkbox"
                checked={sortByHighestBalance}
                onChange={(e) => setSortByHighestBalance(e.target.checked)}
              />
              Highest balance
            </label>

            <button className="btn-primary" onClick={openAddModal}>
              + Add Customer
            </button>
          </div>
        </div>

        <CustomersTable
          customers={filteredCustomers}
          balanceByCustomer={balanceByCustomer}
          onView={(customer) => navigate(`/customers/${customer.customer_id}`)}
          onEdit={openEditModal}
          onDelete={handleDeleteCustomer}
        />
      </div>

      <CustomerFormModal
        isOpen={showModal}
        editingCustomer={editingCustomer}
        formData={customerForm}
        onFormChange={setCustomerForm}
        onClose={closeModal}
        onSubmit={handleSaveCustomer}
      />
    </div>
  );
}