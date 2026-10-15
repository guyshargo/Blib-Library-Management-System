import api from './api';
import type { Member, RegisterRequest } from '../types';

export const memberService = {
    updateContact: async (memberId: number, phone: string, email: string): Promise<Member> => {
        await api.put(`/members/${memberId}/edit-contact`, null, {
            params: { phone, email }
        });
        
        const response = await api.get<Member>(`/members/${memberId}`);
        return response.data;
    },

    deleteAccount: async (memberId: number): Promise<void> => {
    await api.delete(`/members/${memberId}`);
    },

    registerMember: async (registerReq: RegisterRequest) => {
        const response = await api.post('/members/register', registerReq);
        return response.data;
    }
};