import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { peso } from '../../../utils/format';
import type { Customer } from '../../../types/models';

// ── Row action menu (View / Edit / Delete) ────────────────────────────────

interface CustomerRowActionMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CustomerRowActionMenu({ onView, onEdit, onDelete }: CustomerRowActionMenuProps) {
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

    function handleScroll() { setOpen(false); }

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
        type="button"
        onClick={handleOpen}
        className="bg-transparent border-0 w-8 h-8 flex items-center justify-center mx-auto cursor-pointer text-[20px] text-[#141414] p-0 hover:bg-[#f7f8fc] hover:rounded-[6px] hover:text-[#5b50e6]"
      >
        ⋮
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'absolute', top: coords.top, left: coords.left, transform: 'translateX(-100%)' }}
          className="bg-white border border-[#dce0ea] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-[1000] min-w-[120px] overflow-hidden"
        >
          <button
            type="button"
            onClick={() => { onView(); setOpen(false); }}
            className="block w-full px-[14px] py-[9px] text-left bg-transparent border-0 text-[13px] font-semibold text-[#12172a] cursor-pointer hover:text-[#5b50e6]"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => { onEdit(); setOpen(false); }}
            className="block w-full px-[14px] py-[9px] text-left bg-transparent border-0 text-[13px] font-semibold text-[#12172a] cursor-pointer hover:text-[#5b50e6]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => { onDelete(); setOpen(false); }}
            className="block w-full px-[14px] py-[9px] text-left bg-transparent border-0 text-[13px] font-semibold text-[#d92d20] cursor-pointer hover:text-[#5b50e6]"
          >
            Delete
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}

// ── Customers table ───────────────────────────────────────────────────────

interface CustomersTableProps {
  customers: Customer[];
  balanceByCustomer: Record<number, number>;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomersTable({ customers, balanceByCustomer, onView, onEdit, onDelete }: CustomersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className="px-[10px] py-3 text-left text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[130px]">ID</th>
            <th className="px-[10px] py-3 text-left text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[150px]">Name</th>
            <th className="px-[10px] py-3 text-left text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[130px]">Contact</th>
            <th className="px-[10px] py-3 text-left text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[200px]">Address</th>
            <th className="px-[10px] py-3 text-center text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[110px]">Balance</th>
            <th className="px-[10px] py-3 text-center text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[90px]">Status</th>
            <th className="px-[10px] py-3 text-center text-[13px] text-[#5f667a] font-extrabold border-b border-[#edf0f5] w-[60px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const balance = balanceByCustomer[customer.customer_id] || 0;
            const hasBalance = balance > 0;

            return (
              <tr key={customer.customer_id}>
                <td className="px-[10px] py-3 text-[13px] text-[#12172a] font-medium border-b border-[#edf0f5]">
                  CUST-{String(customer.customer_id).padStart(4, '0')}
                </td>
                <td className="px-[10px] py-3 text-[13px] text-[#12172a] font-medium border-b border-[#edf0f5]">
                  {customer.name}
                </td>
                <td className="px-[10px] py-3 text-[13px] text-[#12172a] font-medium border-b border-[#edf0f5]">
                  {customer.contact_no}
                </td>
                <td
                  title={customer.address || 'No address'}
                  className="px-[10px] py-3 text-[13px] text-[#12172a] font-medium border-b border-[#edf0f5] whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {customer.address || 'No address'}
                </td>
                <td className={`px-[10px] py-3 text-[13px] font-medium border-b border-[#edf0f5] text-center ${hasBalance ? 'text-[#d92d20] !font-black' : 'text-[#12172a]'}`}>
                  {peso(balance)}
                </td>
                <td className="px-[10px] py-3 text-[13px] border-b border-[#edf0f5] text-center">
                  <span className={`inline-block px-2 py-1 rounded-[6px] text-[11px] font-extrabold ${hasBalance ? 'bg-[#def8e7] text-[#15803d]' : 'bg-[#e6f0ff] text-[#3155c8]'}`}>
                    {hasBalance ? 'Active' : 'Paid'}
                  </span>
                </td>
                <td className="px-[10px] py-3 border-b border-[#edf0f5] text-center">
                  <CustomerRowActionMenu
                    onView={() => onView(customer)}
                    onEdit={() => onEdit(customer)}
                    onDelete={() => onDelete(customer)}
                  />
                </td>
              </tr>
            );
          })}

          {customers.length === 0 && (
            <tr>
              <td colSpan={7} className="px-[6px] py-7 text-center text-[13px] text-[#6b7280]">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}