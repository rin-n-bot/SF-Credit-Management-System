import { peso } from '../../../../utils/format';
import type { Customer } from '../../../../types/models';
import CustomerRowActionMenu from '../CustomerRowActionMenu';

interface CustomersTableProps {
  customers: Customer[];
  balanceByCustomer: Record<number, number>;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomersTable({
  customers,
  balanceByCustomer,
  onView,
  onEdit,
  onDelete,
}: CustomersTableProps) {
  return (
    <div className="customers-table-container">
      <table className="customers-table">
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
          {customers.map((customer) => {
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
              <td colSpan={7} className="empty">
                No customers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
