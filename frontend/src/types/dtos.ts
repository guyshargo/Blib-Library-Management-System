import type { ActivityType } from './enums';

export interface BorrowRequest {
    memberId: number;
    bookCopyId: number;
    librarianId: number;
    librarianName: string;
}

export interface ChangeReturnDateRequest {
    memberId: number;
    bookCopyId: number;
    newReturnDate: string;
    librarianName: string;
    librarianId: number;
    extensionDate: string;
}

export interface OrderRequest {
    bookId: number;
    memberId: number;
    memberName: string;
    memberPhone: string;
    memberEmail: string;
}

export interface RegisterRequest {
    memberId: number;
    fullName: string;
    userName: string; 
    password: string;
    phone: string;
    email: string;
}

export interface ActivityRequest {
    memberId: number;
    type: ActivityType;
    affectedEntityId: number;
    librarianId?: number;
}