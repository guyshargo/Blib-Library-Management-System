import api from './api';
import type { OrderRequest } from '../types';

export interface WaitlistEntry {
    waitlistId: number;
    bookId: number;
    memberId: number;
    memberName: string;
    memberPhone: string;
    memberEmail: string;
    requestDate: string;
    status: string;
}

export const waitlistService = {
    joinWaitlist: async (orderRequest: OrderRequest): Promise<string> => {
        const response = await api.post<string>('/waitlist/', orderRequest);
        return response.data;
    },

    getMemberWaitlist: async (memberId: number): Promise<WaitlistEntry[]> => {
        const response = await api.get<WaitlistEntry[]>(`/waitlist/member/${memberId}`);
        return response.data;
    },

    leaveWaitlist: async (waitlistId: number): Promise<string> => {
        const response = await api.delete<string>(`/waitlist/${waitlistId}`);
        return response.data;
    }
};
