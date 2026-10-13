import api from './api';
import type { ChangeReturnDateRequest, Member, RegisterRequest } from '../types';

export const librarianService = {
    getMember: async (memberId: number): Promise<Member> => {
        const response = await api.get<Member>(`/members/${memberId}`);
        return response.data;
    },

    updateFreezeStatus: async (memberId: number, status: string, date: string) => {
        await api.put(`/members/${memberId}/freeze-status`, null, { params: { status, date } });
    },

    changeReturnDate: async (changeReturnDateReq: ChangeReturnDateRequest) => {
        await api.put('/borrows/change-return-date', changeReturnDateReq);
    },

    returnBook: async (copyId: number, memberId: number) => {
        await api.delete(`/borrows/copy/${copyId}/member/${memberId}`);
    },

    getAllMembers: async (): Promise<Member[]> => {
        const response = await api.get<Member[]>('/members/all');
        return response.data;
    },

    getMemberByBarcode: async (barcode: string): Promise<Member> => {
        const response = await api.get<Member>(`/members/barcode/${barcode}`);
        return response.data;
    },

    registerMember: async (registerReq: RegisterRequest) => {
        const response = await api.post('/members/register', registerReq);
        return response.data;
    }
};