import type { BookGenre,
    FreezeStatus,
    ActivityType,
    IsOrdered,
    BorrowStatus,
    InvoiceSubject,
    IsRead,
    ArrivalStatus,
    ReportType
 } from './enums';

export interface Activity {
    memberId: number;
    type: ActivityType;
    affectedEntityId: number;
    activityDateTime: string;
}

export interface Book {
    title: string;
    author?: string;
    genre: BookGenre;
    copiesNum: number;
    borrowedCopiesNum: number;
    keywords: string;
    isOrdered: IsOrdered;
    bookId: number;
    ordersNum: number;
    summary?: string;
}

export interface BorrowedBook {
    borrowDate: string;
    returnDate: string;
    memberId: number;
    title: string;
    librarianName: string;
    bookCopyId: number;
    extensionDate?: string;
    librarianId: number;
    bookId: number;
}

export interface BorrowHistory {
    bookCopyId: number;
    memberId: number;
    memberName: string;
    title: string;
    borrowDate: string;
    originalReturnDate: string;
    actualReturnDate?: string;
    lateDays: number;
}

export interface BorrowTracking {
    date: string;
    borrowCount: number;
    lateCount: number;
}

export interface BookCopy {
    copyId: number;
    title: string;
    borrowStatus: BorrowStatus;
    shelfLocation: string;
    barcode: string;
    bookId: number;
}

export interface InvoiceMessage {
    msgId: number;
    memberId: number;
    username: string;
    fullName: string;
    subject: InvoiceSubject;
    content: string;
    date: string;
    isRead: IsRead;
}

export interface Librarian {
    fullName: string;
    phoneNumber: string;
    librarianId: number;
    username: string;
    password?: string;
    emailAddress: string;
    loginStatus: boolean;
}

export interface Member {
    memberId: number;
    fullName: string;
    username: string;
    password?: string;
    freezeStatus: FreezeStatus;
    email: string;
    phoneNum: string;
    freezeStatusDate?: string;
    readerCardBarcode: string;
    loginStatus: boolean;
}

export interface MemberStatusChange {
    id: number;
    fullName: string;
    freezeStatus: FreezeStatus;
    changeStatusDate: string;
}

export interface OrderedBook {
    orderId: number;
    memberName: string;
    memberPhone: string;
    memberEmail: string;
    memberId: number;
    orderDate: string;
    arrivalStatus: ArrivalStatus;
    bookId: number;
    title: string;
    arrivalDate?: string;
}

export interface Report {
    date: string;
    type: ReportType;
    data: string;
}

export interface StatusTracking {
    date: string;
    frozenMembers: number;
    notFrozenMembers: number;
}

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
    activityType: string;
    entityId: number;
}
