import type { SyntheticEvent } from 'react';
import type { Customer, CustomerInput } from '../../../../types/models';

interface CustomerFormModalProps {
  isOpen: boolean;
  editingCustomer: Customer | null;
  formData: CustomerInput;
  onFormChange: (data: CustomerInput) => void;
  onClose: () => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
}

export default function CustomerFormModal({
  isOpen,
  editingCustomer,
  formData,
  onFormChange,
  onClose,
  onSubmit,
}: CustomerFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button type="button" onClick={onClose}>
            x
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Full Name
            <input
              value={formData.name}
              onChange={(e) =>
                onFormChange({ ...formData, name: e.target.value })
              }
              required
            />
          </label>

          <label>
            Contact No.
            <input
              value={formData.contact_no}
              onChange={(e) =>
                onFormChange({ ...formData, contact_no: e.target.value })
              }
              required
            />
          </label>

          <label>
            Address
            <textarea
              value={formData.address || ''}
              onChange={(e) =>
                onFormChange({ ...formData, address: e.target.value })
              }
              rows={3}
            />
          </label>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">{editingCustomer ? 'Save Changes' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
