import type { SyntheticEvent } from 'react';
import type { Customer, CustomerInput } from '../../../types/models';

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
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-[100]">
      <div className="bg-white w-[420px] max-w-[90%] rounded-[12px] p-6 shadow-[0_20px_35px_rgba(0,0,0,0.2)]">

        <div className="flex justify-between items-center mb-5">
          <h2 className="m-0 text-md font-black text-[#12172a]">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-2xl cursor-pointer text-[#12172a] font-medium"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-[6px] font-medium text-xs text-[#12172a]">
            Full Name
            <input
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              required
              placeholder="Enter full name"
              className="h-[38px] w-full border border-[#dce0ea] rounded-[6px] px-3 text-[13px] bg-white text-[#12172a] outline-none focus:border-[#5b50e6] placeholder:text-[#9ca3af] placeholder:font-light"
            />
          </label>

          <label className="flex flex-col gap-[6px] font-medium text-xs text-[#12172a]">
            Contact No.
            <input
              value={formData.contact_no}
              onChange={(e) => onFormChange({ ...formData, contact_no: e.target.value })}
              required
              placeholder="Enter contact number"
              className="h-[38px] w-full border border-[#dce0ea] rounded-[6px] px-3 text-[13px] bg-white text-[#12172a] outline-none focus:border-[#5b50e6] placeholder:text-[#9ca3af] placeholder:font-light"
            />
          </label>

          <label className="flex flex-col gap-[6px] font-medium text-xs text-[#12172a]">
            Address
            <textarea
              value={formData.address || ''}
              onChange={(e) => onFormChange({ ...formData, address: e.target.value })}
              rows={3}
              placeholder="Enter address (optional)"
              className="border border-[#dce0ea] rounded-[6px] px-3 py-2 text-[13px] bg-white text-[#12172a] outline-none focus:border-[#5b50e6] resize-none placeholder:text-[#9ca3af] placeholder:font-light"
            />
          </label>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-[#dce0ea] px-4 py-2 rounded-md text-xs text-[#141414] cursor-pointer hover:border-[#dce0ea] hover:text-[#5b50e6] font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#141414] hover:bg-[#5b50e6] border-0 px-4 py-2 rounded-md text-xs text-white font-bold cursor-pointer hover:opacity-90"
            >
              {editingCustomer ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}