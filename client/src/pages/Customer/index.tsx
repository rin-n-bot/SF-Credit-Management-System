import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { peso, toMoney } from '../../utils/format';
import type { Credit, Customer, CustomerInput } from '../../types/models';
import AppLayout from '../../layout/AppLayout';
import SummaryCard from '../../components/SummaryCard';
import SectionCard from '../../components/SectionCard';
import BalanceFilterSelect from './components/BalanceFilterSelect';
import CustomersTable from './components/CustomersTable';
import CustomerFormModal from './components/CustomerFormModal';

const emptyCustomerForm: CustomerInput = { name: '', contact_no: '', address: '' };
type BalanceFilter = 'all' | 'with-balance' | 'paid';

const balanceFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'With Balance', value: 'with-balance' },
  { label: 'Paid', value: 'paid' },
];

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
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3500);
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
      (a, b) => (balanceByCustomer[b.customer_id] || 0) - (balanceByCustomer[a.customer_id] || 0),
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
    const creditCount = creditCountByCustomer[customer.customer_id] || 0;

    if (creditCount > 0) {
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
    <AppLayout>
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="m-0 text-2xl font-bold text-[#12172a]">Customers</h1>
        <p className="mt-[6px] mb-0 text-[#5f667a] text-sm font-medium">
          Find customers, check balances, and manage their credit.
        </p>
      </div>

      {/* ── Notice banner ── */}
      {notice && (
        <div className="bg-[#f4f2ff] border border-[#d8d3ff] rounded-[6px] px-4 py-3 text-[#5b50e6] font-medium mb-6">
          {notice}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-4 gap-[18px] mb-8 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
        <SummaryCard label="Total Customers" value={summary.totalCustomers} sub="All customers" />
        <SummaryCard label="With Balance" value={summary.customersWithBalance} sub="Active credit" variant="warning" />
        <SummaryCard label="Paid Customers" value={summary.paidCustomers} sub="No outstanding balance" variant="success" />
        <SummaryCard label="Total Outstanding" value={peso(summary.totalOutstanding)} sub="Total unpaid" variant="primary" />
      </div>

      {/* ── Customers table card ── */}
      <SectionCard
        title="All Customers"
        action={
          <div className="flex gap-3 items-center flex-wrap">
            <input
              placeholder="Search by name, contact, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-[38px] w-[260px] border border-[#dce0ea] rounded-md px-3 text-xs bg-white text-[#12172a] outline-none focus:border-[#5b50e6] max-[900px]:w-full"
            />

            <BalanceFilterSelect
              value={balanceFilter}
              onChange={(val) => setBalanceFilter(val as BalanceFilter)}
              options={balanceFilterOptions}
            />

            <label className="h-[38px] inline-flex items-center gap-2 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-xs font-semibold cursor-pointer focus-within:border-[#5b50e6]">
              <input
                type="checkbox"
                checked={sortByHighestBalance}
                onChange={(e) => setSortByHighestBalance(e.target.checked)}
                className="w-[15px] h-[15px] accent-[#5b50e6] cursor-pointer"
              />
              Highest balance
            </label>

            <button
              onClick={openAddModal}
              className="h-[38px] border-0 rounded-md px-4 bg-[#141414] text-white text-xs font-semibold cursor-pointer hover:bg-[#5b50e6]"
            >
              + Add Customer
            </button>
          </div>
        }
      >
        <p className="m-0 mb-3 text-xs text-[#6b7280]">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>

        <CustomersTable
          customers={filteredCustomers}
          balanceByCustomer={balanceByCustomer}
          onView={(customer) => navigate(`/customers/${customer.customer_id}`)}
          onEdit={openEditModal}
          onDelete={handleDeleteCustomer}
        />
      </SectionCard>

      {/* ── Add / Edit customer modal ── */}
      <CustomerFormModal
        isOpen={showModal}
        editingCustomer={editingCustomer}
        formData={customerForm}
        onFormChange={setCustomerForm}
        onClose={closeModal}
        onSubmit={handleSaveCustomer}
      />
    </AppLayout>
  );
}