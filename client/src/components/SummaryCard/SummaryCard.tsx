import type { ReactNode } from 'react';
import './SummaryCard.css';

interface SummaryCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'primary';
}

export default function SummaryCard({
  label,
  value,
  sub,
  variant = 'default',
}: SummaryCardProps) {
  return (
    <div className={`summary-card${variant !== 'default' ? ` summary-card--${variant}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}