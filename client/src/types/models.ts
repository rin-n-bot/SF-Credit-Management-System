// Define TypeScript interfaces for the credit management system
export type CreditStatus = 'Active' | 'Paid' | 'Overdue' | 'Partially Paid';

export interface User {
  user_id: number;
  full_name: string;
  username: string;
}

export interface AuthLoginInput {
  username: string;
  password: string;
}

export interface AuthRegisterInput {
  full_name: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface Customer {
  customer_id: number;
  name: string;
  contact_no: string;
  address: string | null;
}

export interface CustomerInput {
  name: string;
  contact_no: string;
  address?: string | null;
}

export interface Credit {
  credit_id: number;
  customer_id: number;
  trans_date: string | Date;
  due_date: string | Date;
  total_amount: string | number;
  remaining_balance: string | number;
  status: CreditStatus;
}

export interface CreditInput {
  customer_id: number;
  trans_date: string;
  due_date: string;
  total_amount: number;
}

export interface Payment {
  payment_id: number;
  customer_id: number;
  credit_id: number;
  pay_date: string | Date;
  amount_paid: string | number;
}

export interface PaymentInput {
  customer_id: number;
  credit_id: number;
  pay_date: string;
  amount_paid: number;
}

export interface CreditDetail {
  detail_id: number;
  credit_id: number;
  item_name: string;
  quantity: number;
  price: string | number;
}

export interface CreditDetailInput {
  credit_id: number;
  item_name: string;
  quantity: number;
  price: number;
}

export interface CreditItemDraft {
  item_name: string;
  quantity: number;
  price: number;
}