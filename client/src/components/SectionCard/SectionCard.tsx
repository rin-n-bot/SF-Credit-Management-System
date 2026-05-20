import type { ReactNode } from 'react';
import './SectionCard.css';

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  action,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <div className={`section-card ${className}`.trim()}>
      {(title || action) && (
        <div className="section-card__header">
          {title && <h3>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}