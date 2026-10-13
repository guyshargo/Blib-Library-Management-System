import api from './api';
import type { OrderedBook, Book, OrderRequest } from '../types';
import type { ArrivalStatus } from '../types/enums';

export const orderService = {
    getMemberOrders: async (memberId: number): Promise<OrderedBook[]> => {
        const response = await api.get<OrderedBook[]>(`/orders/member/${memberId}`);
        return response.data;
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
};