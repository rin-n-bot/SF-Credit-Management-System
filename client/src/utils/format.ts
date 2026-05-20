// Utility functions for formatting values such as currency and dates
export function toMoney(value: string | number | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}


// Format a value as Philippine Peso currency
export function peso(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(toMoney(value));
}


// Format a date value into a readable string
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}