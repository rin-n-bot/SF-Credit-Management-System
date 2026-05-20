import type {
  AuthLoginInput,
  AuthRegisterInput,
  AuthResponse,
  Customer,
  CustomerInput,
  Credit,
  CreditDetail,
  CreditDetailInput,
  CreditInput,
  Payment,
  PaymentInput,
} from './types/models';


// Global type declarations, for the window.api object provided by Electron's contextBridge.
declare global {
  interface Window {
    api: {
      auth: {
        login: (data: AuthLoginInput) => Promise<AuthResponse>;
        register: (data: AuthRegisterInput) => Promise<AuthResponse>;
      };
      customer: {
        getAll: () => Promise<Customer[]>;
        add: (data: CustomerInput) => Promise<Customer>;
        update: (data: Customer) => Promise<Customer>;
        delete: (id: number) => Promise<{ success: boolean }>;
      };
      credit: {
        getAll: () => Promise<Credit[]>;
        getByCustomer: (id: number) => Promise<Credit[]>;
        add: (data: CreditInput) => Promise<Credit>;
        update: (data: Pick<Credit, 'credit_id' | 'due_date' | 'total_amount'>) => Promise<Credit>;
        delete: (id: number) => Promise<{ success: boolean }>;
      };
      payment: {
        getAll: () => Promise<Payment[]>;
        getByCustomer: (id: number) => Promise<Payment[]>;
        add: (data: PaymentInput) => Promise<Payment>;
        delete: (id: number) => Promise<{ success: boolean }>;
      };
      creditDetail: {
        getByCredit: (id: number) => Promise<CreditDetail[]>;
        add: (data: CreditDetailInput) => Promise<CreditDetail>;
      };
    };
  }
}

export {};