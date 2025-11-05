import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
}

export function DataGrid<T extends { id: string }>({
  columns,
  data,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
}: DataGridProps<T>) {
  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs  text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      style={{ width: column.width }}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onRowClick?.(item)}
                      className={`${
                        onRowClick
                          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                          : ''
                      }`}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100"
                        >
                          {column.render
                            ? column.render(item)
                            : (item[column.key as keyof T] as ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
