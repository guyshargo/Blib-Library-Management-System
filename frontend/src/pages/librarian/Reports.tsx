import React, { useEffect, useMemo, useState } from 'react';
import { reportService } from '../../services/reportService';
import type { ReportType } from '../../types/enums';
import DataTable, { type DataTableColumn } from '../../components/common/DataTable';
import Button from '../../components/ui/Button';
import SelectDropdown from '../../components/ui/SelectDropdown';
import { REPORT_CONFIG, CHART_TOOLTIP_STYLE } from '../../config/reportConfig';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Reports: React.FC = () => {
    const [availableDates, setAvailableDates] = useState<{ years: number[], months: number[] }>({ years: [], months: [] });
    const [datesLoading, setDatesLoading] = useState(true);
    const [datesError, setDatesError] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedType, setSelectedType] = useState<ReportType>('BORROW_REPORT');
    const [headers, setHeaders] = useState<string[]>([]);
    const [tableData, setTableData] = useState<string[][]>([]);
    const [reportError, setReportError] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');

    const exportFormatOptions = [
        { value: 'csv', label: 'CSV (.csv)' },
        { value: 'json', label: 'JSON (.json)' },
    ];

    const handleExport = () => {
        if (tableData.length === 0) {
            alert('No data records available to export.');
            return;
        }
        const filename = `${selectedType.toLowerCase()}_${selectedYear}_${selectedMonth}`;
        if (exportFormat === 'csv') {
            const isDateString = (str: string) => /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}(:\d{2})?)?$/.test((str ?? '').trim());
            const escapeCell = (str: string) => {
                const trimmed = str ?? '';
                if (isDateString(trimmed)) {
                    // Use Excel formula string syntax to force text display and prevent ### hashtags
                    return `="${trimmed}"`;
                }
                return `"${trimmed.replace(/"/g, '""')}"`;
            };
            const headerRow = headers.map(escapeCell).join(',');
            const rows = tableData.map(row => row.map(cell => escapeCell(cell)).join(',')).join('\n');
            const csvContent = `${headerRow}\n${rows}`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const jsonObjects = tableData.map(row => {
                const obj: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    obj[h] = row[idx] ?? '';
                });
                return obj;
            });
            const jsonContent = JSON.stringify(jsonObjects, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };



    const fetchDates = async () => {
        setDatesLoading(true);
        setDatesError(false);
        try {
            const dates = await reportService.getAvailableDates();
            setAvailableDates(dates);
            if (dates.months.length > 0 && !selectedMonth) {
                setSelectedMonth(dates.months[dates.months.length - 1].toString());
            }
            if (dates.years.length > 0 && !selectedYear) {
                setSelectedYear(dates.years[dates.years.length - 1].toString());
            }
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

    const handleGenerate = async (type: ReportType = selectedType, month: string = selectedMonth, year: string = selectedYear) => {
        if (!month || !year) {
            setReportError('Select a month and year to generate a report.');
            setHeaders([]);
            setTableData([]);
            return;
        }

        setReportLoading(true);
        setReportError('');
        try {
            const report = await reportService.generateReport(type, Number(month), year);
            const lines = report.data.trim().split(/\r?\n/).filter(line => line.trim());
            const [headerLine = '', ...dataLines] = lines;

            setHeaders(
                headerLine
                    .split(',')
                    .map(h => h.trim().replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '))
            );
            setTableData(dataLines.map(row => row.split(',').map(cell => cell.trim())));
        } catch (error) {
            console.error('Failed to generate report', error);
            setHeaders([]);
            setTableData([]);
            setReportError('Unable to generate this report. Check your connection and try again.');
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (!datesLoading && selectedMonth && selectedYear) {
            void handleGenerate(selectedType, selectedMonth, selectedYear);
        }
    }, [datesLoading]);

    const columns = useMemo<DataTableColumn<string[]>[]>(() => 
        headers.map((header, index) => ({
            key: `${header}-${index}`,
            header,
            render: row => row[index] ?? '',
        })),
    [headers]);

    const chartData = useMemo(() => {
        if (selectedType === 'BORROW_REPORT') {
            let onTime = 0;
            let late1To3 = 0;
            let late4To7 = 0;
            let late8Plus = 0;

            tableData.forEach(row => {
                const lateDays = Number.parseInt(row[6] || '0', 10) || 0;
                if (lateDays <= 0) {
                    onTime++;
                } else if (lateDays <= 3) {
                    late1To3++;
                } else if (lateDays <= 7) {
                    late4To7++;
                } else {
                    late8Plus++;
                }
            });

            return [
                { name: 'On-Time', series1: onTime, series2: 0 },
                { name: '1-3 Days Late', series1: late1To3, series2: 0 },
                { name: '4-7 Days Late', series1: late4To7, series2: 0 },
                { name: '8+ Days Late', series1: late8Plus, series2: 0 },
            ];
        }

        return tableData.map(row => {
            if (selectedType === 'MEMBER_STATUS_REPORT') {
                const status = (row[2] || '').trim().toUpperCase();
                return {
                    name: row[3] || row[1] || 'Unknown date',
                    series1: status === 'FROZEN' ? 1 : 0,
                    series2: status === 'NOT_FROZEN' || status === 'NOTFROZEN' ? 1 : 0,
                };
            }

            return {
                name: row[0] || 'Unknown date',
                series1: Number.parseInt(row[1] || '0', 10) || 0,
                series2: Number.parseInt(row[2] || '0', 10) || 0,
            };
        });
    }, [selectedType, tableData]);

    // Deduplicate by MemberID (row[0]) so each member is only counted once using their latest status
    const latestMemberStatusMap = useMemo(() => {
        if (selectedType !== 'MEMBER_STATUS_REPORT') return new Map<string, string>();
        const memberMap = new Map<string, string>();
        tableData.forEach(row => {
            const memberId = (row[0] || '').trim();
            const status = (row[2] || '').trim().toUpperCase();
            if (memberId) {
                memberMap.set(memberId, status);
            }
        });
        return memberMap;
    }, [selectedType, tableData]);

    const pieData = useMemo(() => {
        if (selectedType !== 'MEMBER_STATUS_REPORT') return [];
        let frozen = 0;
        let active = 0;
        latestMemberStatusMap.forEach(status => {
            if (status === 'FROZEN') frozen++;
            else active++;
        });
        return [
            { name: 'Frozen Members', value: frozen, color: 'var(--color-chart-series-1)' },
            { name: 'Active Members', value: active, color: 'var(--color-chart-series-2)' },
        ];
    }, [selectedType, latestMemberStatusMap]);

    const kpiMetrics = useMemo(() => {
        const totalRecords = tableData.length;
        if (selectedType === 'BORROW_REPORT') {
            let lateCount = 0;
            tableData.forEach(row => {
                const lateDays = Number.parseInt(row[6] || '0', 10) || 0;
                if (lateDays > 0) lateCount++;
            });
            return { totalRecords, sumSeries1: totalRecords, sumSeries2: lateCount };
        }
        if (selectedType === 'MEMBER_STATUS_REPORT') {
            return {
                totalRecords, // Total status log entries in the table
                sumSeries1: pieData[0]?.value ?? 0, // Unique Frozen members at month-end
                sumSeries2: pieData[1]?.value ?? 0, // Unique Active members at month-end
            };
        }
        if (selectedType === 'STATUS_TRACKING') {
            const lastDay = chartData[chartData.length - 1];
            return {
                totalRecords,
                sumSeries1: lastDay?.series1 ?? 0,
                sumSeries2: lastDay?.series2 ?? 0,
            };
        }
        const sumSeries1 = chartData.reduce((acc, curr) => acc + curr.series1, 0);
        const sumSeries2 = chartData.reduce((acc, curr) => acc + curr.series2, 0);
        return { totalRecords, sumSeries1, sumSeries2 };
    }, [selectedType, tableData, chartData, pieData]);

    const monthFormatter = new Intl.DateTimeFormat(navigator.language, { month: 'long' });

    const monthOptions = useMemo(() => availableDates.months.map(m => ({
        value: m,
        label: monthFormatter.format(new Date(2020, m - 1, 1))
    })), [availableDates.months, monthFormatter]);

    const yearOptions = useMemo(() => availableDates.years.map(y => ({
        value: y,
        label: String(y)
    })), [availableDates.years]);

    const currentConfig = REPORT_CONFIG[selectedType];

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 font-sans sm:px-6 lg:px-8 lg:py-8">
            {/* Innovative Bento Top Bar: Title + Period selectors */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-8 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-text">Executive Intelligence</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">System Reports Studio</h1>
                </div>
                <div className="lg:col-span-4 flex items-center justify-end gap-2">
                    <SelectDropdown
                        value={selectedMonth}
                        onChange={val => {
                            setSelectedMonth(val);
                            void handleGenerate(selectedType, val, selectedYear);
                        }}
                        options={monthOptions}
                        placeholder="Month"
                        disabled={datesLoading}
                        ariaLabel="Select month"
                    />
                    <SelectDropdown
                        value={selectedYear}
                        onChange={val => {
                            setSelectedYear(val);
                            void handleGenerate(selectedType, selectedMonth, val);
                        }}
                        options={yearOptions}
                        placeholder="Year"
                        disabled={datesLoading}
                        ariaLabel="Select year"
                    />
                </div>
            </div>

            {datesError && (
                <div className="flex items-center justify-between rounded-xl border border-danger-border bg-danger-subtle p-4 text-danger-text text-xs" role="alert">
                    <span>Unable to load report dates.</span>
                    <Button variant="danger" size="sm" onClick={() => void fetchDates()}>Retry</Button>
                </div>
            )}

            {/* Asymmetrical Bento Grid: Left Report Type Selector & KPIs (Span 4) + Right Analytics Chart Studio (Span 8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Report Type Cards & KPIs (Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary px-1">Select Report Domain</span>
                    {(Object.keys(REPORT_CONFIG) as ReportType[]).map(type => {
                        const isSelected = selectedType === type;
                        const info = REPORT_CONFIG[type];
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => {
                                    setSelectedType(type);
                                    void handleGenerate(type, selectedMonth, selectedYear);
                                }}
                                className={`flex flex-col gap-1 rounded-2xl p-4 text-left transition-all active:scale-[0.96] border ${
                                    isSelected 
                                        ? 'bg-accent text-accent-text font-bold shadow-md ring-2 ring-accent/30 border-accent' 
                                        : 'bg-surface border-border-subtle hover:bg-surface-soft text-primary'
                                }`}
                            >
                                <span className={`text-xs font-bold ${isSelected ? 'text-accent-text' : 'text-primary'}`}>
                                    {info.title}
                                </span>
                                <span className={`text-[11px] ${isSelected ? 'text-accent-text/90 font-medium' : 'text-secondary'} line-clamp-1`}>
                                    {info.desc}
                                </span>
                            </button>
                        );
                    })}

                    {/* KPI Summary Cards Sidecar */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-0.5 rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Records</span>
                            <span className="text-lg font-extrabold text-primary">{kpiMetrics.totalRecords}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{currentConfig.s1}</span>
                            <span className="text-lg font-extrabold text-primary">{kpiMetrics.sumSeries1}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{currentConfig.s2}</span>
                            <span className="text-lg font-extrabold text-primary">{kpiMetrics.sumSeries2}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Always-On Analytics Chart Studio (Span 8) */}
                <div className="lg:col-span-8 flex flex-col rounded-3xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-surface-soft/50">
                        <div>
                            <h2 className="text-base font-bold text-primary">{currentConfig.title} Analytics</h2>
                            <p className="text-[11px] text-secondary">
                                {selectedMonth && selectedYear ? `${monthFormatter.format(new Date(2020, Number(selectedMonth) - 1, 1))} ${selectedYear}` : 'All Time'}
                            </p>
                        </div>
                        <span className="rounded-xl border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                            Live Visualization
                        </span>
                    </div>

                    {/* Studio Canvas / Chart */}
                    <div className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="h-[350px] w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    {currentConfig.chartType === 'line' ? (
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                                            <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} />
                                            <YAxis stroke="var(--color-text-secondary)" tick={{ fontSize: 12 }} />
                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE}
                                                     itemStyle={{ color: '#f8fafc', padding: '2px 0' }} 
                                                     labelStyle={{ color: '#cbd5e1', fontWeight: '700', marginBottom: '4px' }} 
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                            <Line type="monotone" dataKey="series1" stroke="var(--color-chart-series-1)" strokeWidth={3} dot={{ r: 3 }} name={currentConfig.s1} />
                                            <Line type="monotone" dataKey="series2" stroke="var(--color-chart-series-2)" strokeWidth={3} dot={{ r: 3 }} name={currentConfig.s2} />
                                        </LineChart>
                                    ) : currentConfig.chartType === 'pie' ? (
                                        <PieChart>
                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} 
                                                     itemStyle={{ color: '#f8fafc', padding: '2px 0' }} 
                                                     labelStyle={{ color: '#cbd5e1', fontWeight: '700', marginBottom: '4px' }} 
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} paddingAngle={4} label>
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    ) : (
                                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                                            <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} />
                                            <YAxis stroke="var(--color-text-secondary)" tick={{ fontSize: 12 }} />
                                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} 
                                                     itemStyle={{ color: '#f8fafc', padding: '2px 0' }} 
                                                     labelStyle={{ color: '#cbd5e1', fontWeight: '700', marginBottom: '4px' }} 
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                            <Bar dataKey="series1" fill="var(--color-chart-series-1)" radius={[4, 4, 0, 0]} name={currentConfig.s1} />
                                            {currentConfig.s2 && <Bar dataKey="series2" fill="var(--color-chart-series-2)" radius={[4, 4, 0, 0]} name={currentConfig.s2} />}
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Full-Width Section: Collapsible Data Records Table */}
            <div className="flex flex-col rounded-3xl border border-border-subtle bg-surface shadow-sm overflow-hidden mt-2">
                <div className="flex flex-wrap items-center justify-between p-4 border-b border-border-subtle bg-surface-soft/50 gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-primary">Raw Data Records</h2>
                        <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-secondary border border-border-subtle">
                            {tableData.length} entries
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <SelectDropdown
                            value={exportFormat}
                            onChange={val => setExportFormat(val)}
                            options={exportFormatOptions}
                            placeholder="Format"
                            ariaLabel="Select export format"
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleExport}
                            disabled={tableData.length === 0}
                        >
                            EXPORT
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="overflow-hidden rounded-xl border border-border-subtle shadow-sm">
                        <DataTable
                            columns={columns.length > 0 ? columns : [{ key: 'placeholder', header: 'Report', render: () => '' }]}
                            rows={tableData}
                            getRowKey={(row, index) => `${row[0] ?? 'row'}-${index}`}
                            loadingMessage={reportLoading ? 'Generating data…' : undefined}
                            errorMessage={reportError || undefined}
                            emptyMessage="No records found for this period."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
