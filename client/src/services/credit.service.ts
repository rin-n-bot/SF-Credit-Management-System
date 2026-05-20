import { getApi } from '../electron/client';
import { toMoney } from '../utils/format';
import type { Credit, CreditDetailInput, CreditInput, CreditItemDraft } from '../types/models';


// Service handler for credit-related operations, including API calls and business logic for managing credits and their details
export const creditService = {
  getAll(): Promise<Credit[]> {
    return getApi().credit.getAll();
  },

  getByCustomer(customerId: number): Promise<Credit[]> {
    return getApi().credit.getByCustomer(customerId);
  },

  async addWithDetails(data: CreditInput, items: CreditItemDraft[]): Promise<Credit> {
    const credit = await getApi().credit.add(data);

    for (const item of items) {
      const detail: CreditDetailInput = {
        credit_id: credit.credit_id,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
      };

      await getApi().creditDetail.add(detail);
    }

    return credit;
  },

  update(data: Pick<Credit, 'credit_id' | 'due_date' | 'total_amount'>): Promise<Credit> {
    return getApi().credit.update(data);
  },

  delete(creditId: number): Promise<{ success: boolean }> {
    return getApi().credit.delete(creditId);
  },

  getCustomerBalance(credits: Credit[]): number {
    return credits.reduce((sum, credit) => sum + toMoney(credit.remaining_balance), 0);
  },
};