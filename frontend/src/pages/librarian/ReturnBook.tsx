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

            const borrowsData = await borrowService.getMemberBorrows(memberData.id);
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
        if (!window.confirm("Are you sure you want to return this book?")) return;

        try {
            const returnDate = new Date();
            const dueDate = new Date(book.returnDate);

            const oneWeekLate = new Date(dueDate);
            oneWeekLate.setDate(oneWeekLate.getDate() + 7);

            if (returnDate > oneWeekLate) {
                await librarianService.updateFreezeStatus(book.memberId, "Frozen", returnDate.toISOString().split('T')[0]);
            }

            await librarianService.returnBook(book.copyOfBookId, book.memberId);

            const isLate = returnDate > dueDate;
            const diffDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
            const activityDesc = isLate 
                ? `LATE_BOOK_RETURN,returned ${book.title} late by ${diffDays} days`
                : `returning,return ${book.title}`;

            await borrowService.addActivity({
                membershipNumber: book.memberId,
                activityType: activityDesc.split(',')[0],
                entityId: book.copyOfBookId
            });

            alert("The book has been successfully returned.");
            setBorrows(prev => prev.filter(b => b.copyOfBookId !== book.copyOfBookId));
        } catch (error) {
            alert("The book could not be returned.");
        }
    };

    return (
        <div className="flex flex-col p-[30px] font-sans min-h-screen gap-5">
            <h2 className="text-2xl font-bold">Return Book</h2>
            <div className="flex items-end gap-5 bg-surface p-5 rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-primary">Membership Number:</span>
                    <input 
                        className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px]"
                        value={memberIdInput} 
                        onChange={e => setMemberIdInput(e.target.value)} 
                    />
                </div>
                <button className="bg-accent-subtle rounded-full text-primary text-base font-semibold border-2 border-transparent px-[25px] py-2.5 cursor-pointer transition-all duration-200 hover:bg-accent-subtle-hover hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]" onClick={handleSearch}>Find</button>
                <div className="flex flex-col gap-1 ml-5">
                    <span className="text-base font-bold text-primary">Member name:</span>
                    <input className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px] bg-neutral text-secondary cursor-not-allowed" readOnly value={member?.fullName || ''} />
                </div>
            </div>

            <table className="w-full bg-surface rounded-[5px] border-collapse font-semibold mt-2.5">
                <thead>
                    <tr>
                        <th className="bg-table-header p-3 text-left">Copy of book ID</th>
                        <th className="bg-table-header p-3 text-left">Book Name</th>
                    </tr>
                </thead>
                <tbody>
                    {borrows.map(book => (
                        <tr key={book.copyOfBookId} onClick={() => handleReturn(book)} className="odd:bg-surface-soft even:bg-table-row-alt hover:bg-row-hover hover:cursor-pointer">
                            <td className="p-3 border-b border-border-subtle">{book.copyOfBookId}</td>
                            <td className="p-3 border-b border-border-subtle">{book.title}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReturnBook;