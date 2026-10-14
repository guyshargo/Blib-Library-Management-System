import api from './api';
import type { Report } from '../types';
import type { ReportType } from '../types/enums';

export const reportService = {
    getAvailableDates: async () => {
        const response = await api.get<{ years: number[], months: number[] }>('/reports/available-dates');
        return response.data;
    },
    generateReport: async (reportType: ReportType, monthNumber: number, year: string): Promise<Report> => {
        const response = await api.get<Report>('/reports/generate', {
            params: { reportType, monthNumber, year }
        });
        return response.data;
    }
};