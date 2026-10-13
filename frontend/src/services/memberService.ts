import api from './api';
import type { Member } from '../types';

export const memberService = {
    updateContact: async (memberId: number, phone: string, email: string): Promise<Member> => {
        await api.put(`/members/${memberId}/edit-contact`, null, {
            params: { phone, email }
        });
        
        const response = await api.get<Member>(`/members/${memberId}`);
        return response.data;
    }
};