import { getApi } from '../electron/client';
import { toMoney } from '../utils/format';
import type { Credit, Payment } from '../types/models';

function sortUnpaidCreditsByOldestRecord(a: Credit, b: Credit) {
  return a.credit_id - b.credit_id;
}

export const paymentService = {
  getAll(): Promise<Payment[]> {
    return getApi().payment.getAll();
  },

  async payCustomerBalance(customerId: number, amount: number, payDate: string): Promise<Payment[]> {
    const credits = await getApi().credit.getByCustomer(customerId);

    const unpaidCredits = credits
      .filter((credit) => toMoney(credit.remaining_balance) > 0)
      .sort(sortUnpaidCreditsByOldestRecord);

    let remainingPayment = amount;
    const payments: Payment[] = [];

    for (const credit of unpaidCredits) {
      if (remainingPayment <= 0) break;

      const creditBalance = toMoney(credit.remaining_balance);
      const appliedAmount = Math.min(remainingPayment, creditBalance);

      const payment = await getApi().payment.add({
        customer_id: customerId,
        credit_id: credit.credit_id,
        pay_date: payDate,
        amount_paid: appliedAmount,
      });

      payments.push(payment);
      remainingPayment -= appliedAmount;
    }

    return payments;
  },

  filterByCustomer(payments: Payment[], credits: Credit[], customerId: number): Payment[] {
    const customerCreditIds = new Set(
      credits
        .filter((credit) => credit.customer_id === customerId)
        .map((credit) => credit.credit_id),
    );

    return payments.filter((payment) => customerCreditIds.has(payment.credit_id));
  },
};