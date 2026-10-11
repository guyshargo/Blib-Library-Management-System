import React, { useState } from 'react';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import type { BorrowedBook, Member } from '../../types';

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
            const diffDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
            const activityDesc = isLate 
                ? `LATE_BOOK_RETURN,returned ${book.title} late by ${diffDays} days`
                : `returning,return ${book.title}`;

            await borrowService.addActivity({
                memberId: book.memberId,
                activityType: activityDesc.split(',')[0],
                entityId: book.bookCopyId
            });

            alert("Book returned.");
            setBorrows(prev => prev.filter(b => b.bookCopyId !== book.bookCopyId));
        } catch (error) {
            alert("Unable to return this book. Check the connection and try again.");
        }
    };

    return (
        <div className="flex min-h-screen flex-col gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-primary">Return book</h1>
            <div className="grid grid-cols-1 items-end gap-4 rounded-lg bg-surface p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-bold text-primary">Membership Number:</span>
                    <input 
                        className="min-w-0 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm"
                        value={memberIdInput} 
                        onChange={e => setMemberIdInput(e.target.value)} 
                    />
                </div>
                <button className="rounded-md bg-accent-solid px-5 py-3 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover" onClick={handleSearch}>Find member</button>
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-bold text-primary">Member name</span>
                    <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-secondary outline-none sm:text-sm" readOnly value={member?.fullName || ''} />
                </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse rounded-[5px] bg-surface font-semibold">
                <thead>
                    <tr>
                        <th className="bg-table-header p-3 text-left">Copy of book ID</th>
                        <th className="bg-table-header p-3 text-left">Book Name</th>
                    </tr>
                </thead>
                <tbody>
                    {borrows.length === 0 ? (
                        <tr><td className="p-4 text-sm text-muted" colSpan={2}>No borrowed books to return.</td></tr>
                    ) : borrows.map(book => (
                        <tr key={book.bookCopyId} onClick={() => handleReturn(book)} className="odd:bg-surface-soft even:bg-table-row-alt can-hover:bg-row-hover can-hover:cursor-pointer">
                            <td className="p-3 border-b border-border-subtle">{book.bookCopyId}</td>
                            <td className="p-3 border-b border-border-subtle">{book.title}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    );
};

export default ReturnBook;