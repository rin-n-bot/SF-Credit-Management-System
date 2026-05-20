import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import { creditService } from '../../services/credit.service';
import { peso, toMoney } from '../../utils/format';
import type { Credit, Customer, CustomerInput } from '../../types/models';
import './styles.css';

const emptyCustomerForm: CustomerInput = { name: '', contact_no: '', address: '' };
type BalanceFilter = 'all' | 'with-balance' | 'paid';


function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleOpen() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleScroll() { setOpen(false); }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button ref={btnRef} className={`filter-select-btn${open ? ' open' : ''}`} type="button" onClick={handleOpen}>
        {selected?.label}
        <span className="filter-chevron">‹</span>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="filter-dropdown"
          style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={opt.value === value ? 'active' : ''}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}


function ActionMenu({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
    });
  }, []);

  function handleOpen() {
    updateCoords();
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="action-dots"
        type="button"
        onClick={handleOpen}
      >
        ⋮
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="action-dropdown"
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-100%)',
          }}
        >
          <button type="button" onClick={() => { onView(); setOpen(false); }}>View</button>
          <button type="button" onClick={() => { onEdit(); setOpen(false); }}>Edit</button>
          <button type="button" className="danger" onClick={() => { onDelete(); setOpen(false); }}>Delete</button>
        </div>,
        document.body,
      )}
    </>
  );
}

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
    <div className="page customers-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Find customers, check balances, and manage their credit.</p>
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="metric-grid">
        <div className="metric-card">
          <span>Total Customers</span>
          <strong>{summary.totalCustomers}</strong>
        </div>
        <div className="metric-card">
          <span>With Balance</span>
          <strong>{summary.customersWithBalance}</strong>
        </div>
        <div className="metric-card">
          <span>Paid Customers</span>
          <strong>{summary.paidCustomers}</strong>
        </div>
        <div className="metric-card primary">
          <span>Total Outstanding</span>
          <strong>{peso(summary.totalOutstanding)}</strong>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
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

            <FilterSelect
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

        <div className="table-container">
          <table className="data-table customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="th-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const balance = balanceByCustomer[customer.customer_id] || 0;

                return (
                  <tr key={customer.customer_id}>
                    <td>CUST-{String(customer.customer_id).padStart(4, '0')}</td>
                    <td>{customer.name}</td>
                    <td>{customer.contact_no}</td>
                    <td title={customer.address || 'No address'}>
                      {customer.address || 'No address'}
                    </td>
                    <td className={balance > 0 ? 'balance-due' : ''}>{peso(balance)}</td>
                    <td>
                      <span className={balance > 0 ? 'badge active' : 'badge paid'}>
                        {balance > 0 ? 'Active' : 'Paid'}
                      </span>
                    </td>
                    <td className="td-action">
                      <ActionMenu
                        onView={() => navigate(`/customers/${customer.customer_id}`)}
                        onEdit={() => openEditModal(customer)}
                        onDelete={() => handleDeleteCustomer(customer)}
                      />
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button type="button" onClick={closeModal}>
                x
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <label>
                Full Name
                <input
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Contact No.
                <input
                  value={customerForm.contact_no}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, contact_no: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Address
                <textarea
                  value={customerForm.address || ''}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, address: e.target.value })
                  }
                  rows={3}
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit">{editingCustomer ? 'Save Changes' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}