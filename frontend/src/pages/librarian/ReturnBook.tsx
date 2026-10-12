import React, { useState } from 'react';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import type { BorrowedBook, Member } from '../../types';
import FormField from '../../components/FormField';
import DataTable from '../../components/DataTable';

const ReturnBook: React.FC = () => {
    const [memberIdInput, setMemberIdInput] = useState('');
    const [member, setMember] = useState<Member | null>(null);
    const [borrows, setBorrows] = useState<BorrowedBook[]>([]);

    const handleSearch = async () => {
        if (!memberIdInput.trim()) return;
        try {
            const memberData = await librarianService.getMember(parseInt(memberIdInput));
            setMember(memberData);

            const borrowsData = await borrowService.getMemberBorrows(memberData.memberId);
            setBorrows(borrowsData);

            if (borrowsData.length === 0) {
                alert("This member has no borrowed books.");
            }
        } catch (error) {
            setMember(null);
            setBorrows([]);
            alert("The member does not exist or has no books.");
        }
    };

    const handleReturn = async (book: BorrowedBook) => {
        if (!window.confirm(`Return "${book.title}"?`)) return;

        try {
            const returnDate = new Date();
            const dueDate = new Date(book.returnDate);

            const oneWeekLate = new Date(dueDate);
            oneWeekLate.setDate(oneWeekLate.getDate() + 7);

            if (returnDate > oneWeekLate) {
                await librarianService.updateFreezeStatus(book.memberId, "Frozen", returnDate.toISOString().split('T')[0]);
            }

            await librarianService.returnBook(book.bookCopyId, book.memberId);

            const isLate = returnDate > dueDate;
            const activityDesc = isLate ? `LATE_BOOK_RETURN` : `RETURN`;

            await borrowService.addActivity({
                memberId: book.memberId,
                type: activityDesc,
                affectedEntityId: book.bookCopyId
            });

            alert("Book returned.");
            setBorrows(prev => prev.filter(b => b.bookCopyId !== book.bookCopyId));
        } catch (error) {
            alert("Unable to return this book. Check the connection and try again.");
        }
    };

    const columns = [
        {
            key: 'bookCopyId',
            header: 'Copy of book ID',
            render: (book: BorrowedBook) => book.bookCopyId,
        },
        {
            key: 'title',
            header: 'Book Name',
            render: (book: BorrowedBook) => book.title,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-primary">Return book</h1>
            <div className="grid grid-cols-1 items-end gap-4 rounded-lg bg-surface p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                <FormField
                    label="Membership Number:"
                    value={memberIdInput}
                    onChange={e => setMemberIdInput(e.target.value)}
                />
                <button className="rounded-md bg-accent-solid px-5 py-3 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover" onClick={handleSearch}>Find member</button>
                <FormField
                    label="Member name"
                    value={member?.fullName || ''}
                    readOnly
                />
            </div>

            <DataTable
                columns={columns}
                rows={borrows}
                getRowKey={book => book.bookCopyId}
                emptyMessage="No borrowed books to return."
                onRowClick={handleReturn}
                getRowClassName={(_, index) => `${index % 2 === 0 ? 'bg-surface-soft' : 'bg-table-row-alt'} can-hover:bg-row-hover can-hover:cursor-pointer`}
                tableClassName="font-semibold"
            />
        </div>
    );
};

export default ReturnBook;