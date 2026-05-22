import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({ title, action, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white border border-[#dce0ea] rounded-[6px] p-[18px] ${className}`.trim()}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-[14px] gap-3">
          {title && <h3 className="m-0 text-sm font-extrabold text-[#12172a]">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}