import type { ReportType } from '../types/enums';

export interface ReportUIConfig {
    title: string;
    desc: string;
    s1: string;
    s2: string;
    chartType: 'bar' | 'line' | 'pie';
}

export const REPORT_CONFIG: Record<ReportType, ReportUIConfig> = {
    BORROW_REPORT: { title: 'Borrowed Books', desc: 'Overdue severity & return compliance', s1: 'Total Loans', s2: 'Late Loans', chartType: 'bar' },
    MEMBER_STATUS_REPORT: { title: 'Member Status', desc: 'Account freezes & active memberships', s1: 'Frozen', s2: 'Active', chartType: 'pie' },
    BORROW_TRACKING: { title: 'Borrow Tracking', desc: 'Circulation volume & utilization', s1: 'Borrowed', s2: 'Late', chartType: 'line' },
    STATUS_TRACKING: { title: 'Status Tracking', desc: 'Daily frozen vs. active member trends', s1: 'Frozen', s2: 'Active', chartType: 'line' },
};

// High-contrast tooltip style for Recharts
export const CHART_TOOLTIP_STYLE = {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    color: '#f8fafc',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
};