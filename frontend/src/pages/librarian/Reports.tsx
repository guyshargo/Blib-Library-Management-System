import React, { useEffect, useMemo, useState } from 'react';
import { reportService } from '../../services/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ReportKind = 'borrow' | 'member_status';

const reportColumns: Record<ReportKind, string[]> = {
    borrow: ['Member ID', 'Member name', 'Book title', 'Borrow date', 'Due date', 'Return date', 'Days late', 'Copy ID'],
    member_status: ['Member ID', 'Member name', 'Membership status', 'Status change date'],
};

const Reports: React.FC = () => {
    const [availableDates, setAvailableDates] = useState<{ years: number[], months: number[] }>({ years: [], months: [] });
    const [datesLoading, setDatesLoading] = useState(true);
    const [datesError, setDatesError] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedType, setSelectedType] = useState<ReportKind>('borrow');
    const [tableData, setTableData] = useState<string[][]>([]);
    const [reportError, setReportError] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const fetchDates = async () => {
        setDatesLoading(true);
        setDatesError(false);
        try {
            const dates = await reportService.getAvailableDates();
            setAvailableDates(dates);
        } catch (error) {
            console.error('Failed to load report dates', error);
            setDatesError(true);
        } finally {
            setDatesLoading(false);
        }
    };

    useEffect(() => {
        void fetchDates();
    }, []);

    const handleGenerate = async () => {
        if (!selectedMonth || !selectedYear) {
            setReportError('Select a month and year to generate a report.');
            setTableData([]);
            return;
        }

        setReportLoading(true);
        setReportError('');
        try {
            const report = await reportService.generateReport(selectedType, Number(selectedMonth), selectedYear);
            const rows = report.data.trim().split(/\r?\n/).slice(1);
            setTableData(rows.filter(row => row.trim()).map(row => row.split(', ')));
        } catch (error) {
            console.error('Failed to generate report', error);
            setTableData([]);
            setReportError('Unable to generate this report. Check your connection and try again.');
        } finally {
            setReportLoading(false);
        }
    };

    const chartData = useMemo(() => tableData.map(row => {
        if (selectedType === 'borrow') {
            const borrowDate = new Date(row[3]);
            const dueDate = new Date(row[4]);
            const scheduledDays = Number.isNaN(borrowDate.getTime()) || Number.isNaN(dueDate.getTime())
                ? 0
                : Math.max(0, Math.round((dueDate.getTime() - borrowDate.getTime()) / 86_400_000));
            return {
                name: row[2] || row[1] || 'Unknown book',
                scheduledDays,
                lateDays: Number.parseInt(row[6] || '0', 10) || 0,
            };
        }

        const status = (row[2] || '').trim().toLowerCase();
        return {
            name: row[3] || row[1] || 'Unknown date',
            frozenChanges: status === 'frozen' ? 1 : 0,
            activeChanges: status === 'notfrozen' || status === 'not frozen' ? 1 : 0,
        };
    }), [selectedType, tableData]);

    const columns = reportColumns[selectedType];
    const monthFormatter = new Intl.DateTimeFormat(navigator.language, { month: 'long' });

    return (
        <div className="flex min-h-screen flex-col gap-5 p-4 font-sans text-primary sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold">System reports</h1>

            {datesError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load report dates. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void fetchDates()}>
                        Retry
                    </button>
                </div>
            )}

            <form
                className="grid grid-cols-1 items-end gap-4 rounded-lg bg-surface p-4 shadow-sm sm:grid-cols-2 sm:p-5 xl:grid-cols-4"
                onSubmit={event => {
                    event.preventDefault();
                    void handleGenerate();
                }}
            >
                <label className="flex flex-col gap-2 text-sm font-semibold text-secondary">
                    Month
                    <select
                        className="min-w-0 rounded-md border border-border bg-surface px-3 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm"
                        value={selectedMonth}
                        onChange={event => setSelectedMonth(event.target.value)}
                        disabled={datesLoading}
                    >
                        <option value="">Select a month</option>
                        {availableDates.months.map(month => (
                            <option key={month} value={month}>{monthFormatter.format(new Date(2020, month - 1, 1))}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-secondary">
                    Year
                    <select
                        className="min-w-0 rounded-md border border-border bg-surface px-3 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm"
                        value={selectedYear}
                        onChange={event => setSelectedYear(event.target.value)}
                        disabled={datesLoading}
                    >
                        <option value="">Select a year</option>
                        {availableDates.years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-secondary">
                    Report type
                    <select
                        className="min-w-0 rounded-md border border-border bg-surface px-3 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm"
                        value={selectedType}
                        onChange={event => {
                            setSelectedType(event.target.value as ReportKind);
                            setTableData([]);
                            setReportError('');
                        }}
                    >
                        <option value="borrow">Borrowed books</option>
                        <option value="member_status">Member status changes</option>
                    </select>
                </label>

                <button
                    type="submit"
                    className="rounded-md bg-accent-solid px-5 py-3 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={reportLoading || datesLoading || datesError}
                >
                    {reportLoading ? 'Generating…' : 'Generate report'}
                </button>
            </form>

            {reportError && <p className="border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">{reportError}</p>}

            {!reportLoading && tableData.length === 0 && !reportError && (
                <p className="rounded-lg bg-surface p-5 text-sm text-muted">
                    Choose a month, year, and report type to view report data.
                </p>
            )}

            {tableData.length > 0 && (
                <section className="flex flex-col gap-6 rounded-lg bg-surface p-4 sm:p-5" aria-label="Generated report">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left">
                            <thead>
                                <tr>
                                    {columns.map(column => <th key={column} className="bg-table-header p-3 font-semibold">{column}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, index) => (
                                    <tr key={index} className="odd:bg-surface-soft even:bg-table-row-alt can-hover:bg-row-hover">
                                        {columns.map((column, cellIndex) => (
                                            <td key={column} className="border-b border-border-subtle p-3">{row[cellIndex] ?? ''}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {selectedType === 'borrow' ? (
                                    <>
                                        <Bar dataKey="scheduledDays" fill="var(--color-chart-series-1)" name="Scheduled loan days" />
                                        <Bar dataKey="lateDays" fill="var(--color-chart-series-2)" name="Days late" />
                                    </>
                                ) : (
                                    <>
                                        <Bar dataKey="frozenChanges" fill="var(--color-chart-series-1)" name="Frozen-status changes" />
                                        <Bar dataKey="activeChanges" fill="var(--color-chart-series-2)" name="Active-status changes" />
                                    </>
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Reports;
