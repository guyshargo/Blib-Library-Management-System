import api from './api';
import type { ActivityRequest, Activity } from '../types';

export const activityService = {
    addActivity: async (activityReq: ActivityRequest): Promise<void> => {
        await api.post('/activities/', activityReq);
    },

    getMemberActivities: async (memberId: number): Promise<Activity[]> => {
        const response = await api.get<Activity[]>(`/activities/member/${memberId}`);
        return response.data;
    },

    getLibrarianActivities: async (librarianId: number): Promise<Activity[]> => {
        const response = await api.get<Activity[]>(`/activities/librarian/${librarianId}`);
        return response.data;
    }
};