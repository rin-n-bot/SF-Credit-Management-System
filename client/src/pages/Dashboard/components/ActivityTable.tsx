import type { ReactNode } from 'react';
import SectionCard from '../../../components/SectionCard';

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
          <button
            type="button"
            onClick={onViewAll}
            className="bg-transparent border-0 text-[#141414] text-xs font-bold cursor-pointer hover:text-[#5b50e6] hover:underline p-0"
          >
            View all
          </button>
        )
      }
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.label}
                className="px-[6px] py-2 border-b border-[#edf0f5] text-left text-xs text-[#5f667a] font-extrabold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyExtractor(row)}>
              {columns.map((col) => (
                <td
                  key={col.label}
                  className="px-[6px] py-2 border-b border-[#edf0f5] text-left text-xs text-[#12172a] font-medium"
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-[6px] py-7 text-center text-xs text-[#6b7280]"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </SectionCard>
  );
}