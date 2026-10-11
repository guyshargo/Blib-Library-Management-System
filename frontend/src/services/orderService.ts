import api from './api';
import type { OrderedBook, Book, OrderRequest, ActivityRequest } from '../types';
import type { ArrivalStatus } from '../types/enums';

type OrderedBookResponse = Omit<OrderedBook, 'title' | 'memberId'> & {
    bookTitle: string;
    membershipNumber: number;
};

export const orderService = {
    getMemberOrders: async (memberId: number): Promise<OrderedBook[]> => {
        const response = await api.get<OrderedBookResponse[]>(`/orders/member/${memberId}`);
        return response.data.map(({ bookTitle, membershipNumber, ...order }) => ({
            ...order,
            title: bookTitle,
            memberId: membershipNumber,
        }));
    },

    getBookDetails: async (bookId: number): Promise<Book> => {
        const response = await api.get<Book>(`/books/${bookId}`);
        return response.data;
    },

    orderBook: async (orderReq: OrderRequest) => {
        const response = await api.post('/orders/', orderReq);
        return response.data;
    },

    cancelOrder: async (orderId: number, bookId: number, arrivalStatus: ArrivalStatus) => {
        const response = await api.delete(`/orders/${orderId}`, {
            params: { bookId, arrivalStatus }
        });
        return response.data;
    },

    updateOrderStatus: async (bookId: number, numberOfOrders: number, increase: boolean) => {
        await api.put('/orders/status', null, {
            params: { bookId, numberOfOrders, increase }
        });
    },

    addActivity: async (activityReq: ActivityRequest) => {
        await api.post('/activities/', activityReq);
    }
};