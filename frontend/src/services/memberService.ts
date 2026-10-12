import api from './api';
import type { Activity, Member } from '../types';

export const memberService = {
    getActivities: async (memberId: number): Promise<Activity[]> => {
        const response = await api.get<Activity[]>(`/activities/member/${memberId}`);
        return response.data;
    },

    updateContact: async (memberId: number, phone: string, email: string): Promise<Member> => {
        // Update details
        await api.put(`/members/${memberId}/edit-contact`, null, {
            params: { phone, email }
        });
        
        const response = await api.get<Member>(`/members/${memberId}`);
        return response.data;
    }
};