import api from './api';
import type { Activity, Member } from '../types';

type ActivityResponse = Omit<Activity, 'type'> & {
    activityType: Activity['type'];
};

export const memberService = {
    getActivities: async (memberId: number): Promise<Activity[]> => {
        const response = await api.get<ActivityResponse[]>(`/activities/member/${memberId}`);
        return response.data.map(({ activityType, ...activity }) => ({
            ...activity,
            type: activityType,
        }));
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