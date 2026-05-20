import { getApi } from '../electron/client';
import type { Customer, CustomerInput } from '../types/models';


// Service handler for customer-related operations, including API calls for CRUD operations on customers
export const customerService = {
  getAll(): Promise<Customer[]> {
    return getApi().customer.getAll();
  },

  add(data: CustomerInput): Promise<Customer> {
    return getApi().customer.add(data);
  },

  update(data: Customer): Promise<Customer> {
    return getApi().customer.update(data);
  },

  delete(customerId: number): Promise<{ success: boolean }> {
    return getApi().customer.delete(customerId);
  },
};