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
    emptyMessage: ReactNode;
    loadingMessage?: string;
    errorMessage?: ReactNode;
    getRowClassName?: (row: T, index: number) => string;
    tableClassName?: string;
    onRowClick?: (row: T) => void;
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
    onRowClick,
}: DataTableProps<T>) => (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface shadow-sm">
        <table className={`w-full min-w-[38rem] border-collapse text-start text-sm sm:text-base ${tableClassName}`}>
            <thead>
                <tr className="border-b-2 border-border bg-surface-soft text-primary">
                    {columns.map(column => (
                        <th
                            key={column.key}
                            scope="col"
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-center ${column.headerClassName ?? ''}`}
                        >
                            {column.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
                {loadingMessage ? (
                    <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-muted text-sm" role="status">
                            {loadingMessage}
                        </td>
                    </tr>
                ) : errorMessage ? (
                    <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-danger-text text-sm" role="alert">
                            {errorMessage}
                        </td>
                    </tr>
                ) : rows.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-muted text-sm">
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    rows.map((row, index) => (
                        <tr
                            key={getRowKey(row)}
                            onClick={() => onRowClick?.(row)}
                            className={getRowClassName?.(row, index) ?? (index % 2 === 0 ? 'bg-surface transition-colors duration-150 can-hover:hover:bg-surface-soft/80' : 'bg-surface-soft/30 transition-colors duration-150 can-hover:hover:bg-surface-soft/80')}
                        >
                            {columns.map(column => (
                                <td
                                    key={column.key}
                                    className={`break-words px-6 py-4 text-primary text-center ${column.cellClassName ?? ''}`}
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
