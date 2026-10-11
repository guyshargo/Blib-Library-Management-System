import api from './api';
import type { ActivityRequest, BorrowedBook, BookCopy, BorrowRequest } from '../types';

type BorrowedBookResponse = Omit<BorrowedBook, 'title' | 'bookCopyId'> & {
    title?: string;
    nameOfBook?: string;
    bookCopyId?: number;
    copyOfBookId?: number;
};

export const borrowService = {
    getMemberBorrows: async (memberId: number): Promise<BorrowedBook[]> => {
        const response = await api.get<BorrowedBookResponse[]>(`/borrows/member/${memberId}`);
        return response.data.map(borrow => {
            const title = borrow.title ?? borrow.nameOfBook;
            const bookCopyId = borrow.bookCopyId ?? borrow.copyOfBookId;
            if (!title || bookCopyId === undefined) {
                throw new Error('Borrowed book response is missing its title or copy ID.');
            }
            return { ...borrow, title, bookCopyId };
        });
    },

    extendBorrow: async (memberId: number, copyId: number) => {
        const response = await api.put(`/borrows/member/${memberId}/book/${copyId}/extend`);
        return response.data;
    },

    addActivity: async (activityReq: ActivityRequest) => {
        await api.post('/activities/', activityReq);
    },

    getAvailableCopyById: async (bookId: number, memberId: number): Promise<BookCopy> => {
        const response = await api.get<BookCopy>(`/borrows/book/${bookId}/available-copy/member/${memberId}`);
        return response.data;
    },

    getAvailableCopyByBarcode: async (barcode: string, memberId: number) => {
        const response = await api.get(`/borrows/barcode/${barcode}/available-copy/member/${memberId}`);
        return response.data;
    },

    getBookDetails: async (bookId: number) => {
        const response = await api.get(`/books/${bookId}`);
        return response.data;
    },

    commitBorrow: async (borrowReq: BorrowRequest) => {
        const response = await api.post('/borrows/', borrowReq);
        return response.data;
    }
};