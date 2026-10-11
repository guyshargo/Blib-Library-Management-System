import type { Key, ReactNode } from 'react';

export interface DataTableColumn<T> {
    key: Key;
    header: ReactNode;
    render: (row: T, index: number) => ReactNode;
    headerClassName?: string;
    cellClassName?: string;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows: T[];
    getRowKey: (row: T) => Key;
    emptyMessage: string;
    loadingMessage?: string;
    errorMessage?: string;
    getRowClassName?: (row: T, index: number) => string;
    tableClassName?: string;
}

const DataTable = <T,>({
    columns,
    rows,
    getRowKey,
    emptyMessage,
    loadingMessage,
    errorMessage,
    getRowClassName,
    tableClassName = '',
}: DataTableProps<T>) => (
    <div className="overflow-x-auto border border-border-subtle">
        <table className={`w-full min-w-[38rem] border-collapse text-start text-sm sm:text-base ${tableClassName}`}>
            <thead>
                <tr>
                    {columns.map(column => (
                        <th
                            key={column.key}
                            scope="col"
                            className={`bg-table-header p-3 text-start font-semibold ${column.headerClassName ?? ''}`}
                        >
                            {column.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {loadingMessage ? (
                    <tr>
                        <td colSpan={columns.length} className="border-t border-border-subtle p-4 text-center text-muted" role="status">
                            {loadingMessage}
                        </td>
                    </tr>
                ) : errorMessage ? (
                    <tr>
                        <td colSpan={columns.length} className="border-t border-border-subtle p-4 text-center text-danger-text" role="alert">
                            {errorMessage}
                        </td>
                    </tr>
                ) : rows.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="border-t border-border-subtle p-4 text-center text-muted">
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    rows.map((row, index) => (
                        <tr
                            key={getRowKey(row)}
                            className={getRowClassName?.(row, index) ?? (index % 2 === 0 ? 'bg-surface-soft' : 'bg-surface')}
                        >
                            {columns.map(column => (
                                <td
                                    key={column.key}
                                    className={`break-words border-t border-border-subtle p-3 ${column.cellClassName ?? ''}`}
                                >
                                    {column.render(row, index)}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default DataTable;
