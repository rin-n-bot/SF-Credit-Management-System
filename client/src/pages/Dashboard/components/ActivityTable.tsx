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
            className="bg-transparent border-0 text-[#141414] underline p-0 text-[13px] font-bold cursor-pointer hover:text-[#5b50e6]"
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
                className="px-[6px] py-2 border-b border-[#edf0f5] text-left text-sm text-[#5f667a] font-semibold"
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
                  className="px-[6px] py-2 border-b border-[#edf0f5] text-left text-[13px] text-[#12172a] font-medium"
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
                className="px-[6px] py-7 text-center text-sm text-[#6b7280]"
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