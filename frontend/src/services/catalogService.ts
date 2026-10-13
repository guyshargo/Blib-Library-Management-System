import api from './api';
import type { Book, BookCopy, BorrowedBook } from '../types';

export const catalogService = {
    searchBooks: async (title: string, genre: string, freeText: string): Promise<Book[]> => {
        const response = await api.get<Book[]>('/books/search', {
            params: {
                title: title || 'is empty',
                genre: genre || 'is empty',
                freeText: freeText || 'is empty'
            }
        });
        return response.data;
    },

    getAvailableCopy: async (bookId: number, memberId: number): Promise<BookCopy> => {
        const response = await api.get<BookCopy>(`/borrows/book/${bookId}/available-copy/member/${memberId}`);
        return response.data;
    },

    getClosestReturnDate: async (bookId: number): Promise<BorrowedBook> => {
        const response = await api.get<BorrowedBook>(`/borrows/book/${bookId}/closest-return-date`);
        return response.data;
    },

    getBook: async (bookId: number): Promise<Book> => {
        const response = await api.get<Book>(`/books/${bookId}`);
        return response.data;
    }
};