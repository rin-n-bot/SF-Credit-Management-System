import type { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'primary';
}

const valueColorMap = {
  default: 'text-[#12172a]',
  danger: 'text-[#d92d20]',
  success: 'text-[#5b50e6]',
  warning: 'text-[#141414]',
  primary: 'text-[#141414]',
};

export default function SummaryCard({ label, value, sub, variant = 'default' }: SummaryCardProps) {
  return (
    <div className="bg-white border border-[#dce0ea] rounded-md p-5">
      <span className="block text-[#5f667a] text-sm font-semibold">{label}</span>
      <strong className={`block text-2xl font-bold my-[6px] ${valueColorMap[variant]}`}>
        {value}
      </strong>
      {sub && <small className="block text-[#6b7280] text-xs font-medium">{sub}</small>}
    </div>
  );
}