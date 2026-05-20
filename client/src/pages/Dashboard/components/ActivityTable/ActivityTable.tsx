import type { ReactNode } from 'react';
import SectionCard from '../../../../components/SectionCard';
import './ActivityTable.css';

interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
}

interface ActivityTableProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  onViewAll?: () => void;
}

export default function ActivityTable<T>({
  title,
  columns,
  rows,
  keyExtractor,
  emptyMessage = 'No records yet.',
  onViewAll,
}: ActivityTableProps<T>) {
  return (
    <SectionCard
      title={title}
      action={
        onViewAll && (
          <button type="button" className="activity-table__view-all" onClick={onViewAll}>
            View all
          </button>
        )
      }
    >
      <table className="activity-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.label}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyExtractor(row)}>
              {columns.map((col) => (
                <td key={col.label}>{col.render(row)}</td>
              ))}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="activity-table__empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </SectionCard>
  );
}