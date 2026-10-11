import React, { useEffect, useState } from 'react';
import { borrowService } from '../../services/borrowService';
import type { BorrowedBook, Member } from '../../types';

const ExtendBorrow: React.FC = () => {
    const [member, setMember] = useState<Member | null>(null);
    const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);

    const [searchName, setSearchName] = useState('');
    const [isOverdueOnly, setIsOverdueOnly] = useState(false);
    const [selectedCopyId, setSelectedCopyId] = useState<string>('');

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const member = JSON.parse(userStr);
            setMember(member);
            loadBorrows(member.id);
        }
    }, []);

    const loadBorrows = async (memberId: number) => {
        try {
            const data = await borrowService.getMemberBorrows(memberId);
            setBorrowedBooks(data);
        } catch (error) {
            console.error("Failed to load borrowed books", error);
        }
    };

    const filteredBooks = borrowedBooks.filter(book => {
        const matchesName = book.title.toLowerCase().includes(searchName.toLowerCase());

        let matchesOverdue = true;
        if (isOverdueOnly) {
            const returnDate = new Date(book.returnDate);
            returnDate.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            matchesOverdue = now > returnDate;
        }

        return matchesName && matchesOverdue;
    });

    const handleExtend = async () => {
        if (!selectedCopyId) {
            alert("Extension Request: Must insert the ID of the book you want to extend the return date");
            return;
        }

        const selectedBook = borrowedBooks.find(b => b.copyOfBookId.toString() === selectedCopyId);

        if (!selectedBook || !member) {
            alert("Extension Request: There is no book with the inserted ID");
            return;
        }

        const returnDate = new Date(selectedBook.returnDate);
        returnDate.setHours(0, 0, 0, 0);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const oneWeekBefore = new Date(returnDate);
        oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

        if (now > returnDate) {
            alert("Extension Request: Must return book, please contact a librarian from the library");
            return;
        }

        if (now < oneWeekBefore) {
            alert("Extension Request: Borrowed book must be at least one week till return date");
            return;
        }

        if (member.freezeStatus === 'Frozen') {
            alert("Extension Request: Member must not be in frozen status. Please contact the library");
            return;
        }

        try {
            await borrowService.extendBorrow(member.id, selectedBook.copyOfBookId);

            await borrowService.addActivity({
                membershipNumber: member.id,
                activityType: "extendBorrow",
                entityId: selectedBook.bookId
            });

            alert("Extension Request: Approved");
            loadBorrows(member.id);
        } catch (error: any) {
            alert("Extension Request: Not Approved there are orders for the book");
        }
    };

    const inputClass = "rounded-[17px] text-sm px-[15px] py-2 border border-border bg-input";
    const btnClass = "bg-accent-subtle rounded-full text-primary text-base font-semibold border-2 border-transparent px-5 py-2 cursor-pointer transition-all duration-200 hover:bg-accent-subtle-hover hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]";

    return (
        <div className="flex flex-col p-[30px] font-sans min-h-screen gap-[30px]">
            <h2 className="text-[20px] font-bold text-primary self-center">Search Borrowed Books</h2>

            <div className="flex gap-10 items-center justify-center">
                <div className="flex items-center gap-2.5">
                    <span className="text-[20px] font-bold text-primary">Copy of book ID:</span>
                    <input 
                        className={inputClass} 
                        value={selectedCopyId}
                        onChange={e => setSelectedCopyId(e.target.value)}
                    />
                </div>
            </div>

            <table className="w-full bg-surface rounded-[5px] border-collapse border-2 border-accent-subtle font-semibold mt-5">
                <thead>
                    <tr>
                        <th className="bg-table-header p-2.5 text-left border-r border-border-subtle">Borrowed book ID</th>
                        <th className="bg-table-header p-2.5 text-left border-r border-border-subtle">Name</th>
                        <th className="bg-table-header p-2.5 text-left border-r border-border-subtle">Return Date</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBooks.map(book => {
                        const isOverdue = new Date(book.returnDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                        const isSelected = selectedCopyId === book.copyOfBookId.toString();

                        return (
                            <tr 
                                key={book.copyOfBookId} 
                                onClick={() => setSelectedCopyId(book.copyOfBookId.toString())}
                                className={`cursor-pointer ${isSelected ? 'bg-accent-subtle text-primary' : 'odd:bg-surface-soft even:bg-surface hover:bg-row-hover'}`}
                                style={{ backgroundColor: isOverdue && !isSelected ? 'var(--color-danger-subtle)' : undefined }}
                            >
                                <td className="p-2.5 border-r border-border-subtle border-b border-border-subtle">{book.copyOfBookId}</td>
                                <td className="p-2.5 border-r border-border-subtle border-b border-border-subtle">{book.title}</td>
                                <td className="p-2.5 border-r border-border-subtle border-b border-border-subtle">{book.returnDate}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="flex justify-center my-5">
                <button className={btnClass} onClick={handleExtend}>Extend book</button>
            </div>

            <div className="flex gap-10 items-center justify-center">
                <div className="flex items-center gap-2.5">
                    <span className="text-[19px] font-bold text-primary">Book Name:</span>
                    <input 
                        className={inputClass} 
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2.5 ml-5">
                    <input 
                        type="checkbox" 
                        id="overdue"
                        checked={isOverdueOnly}
                        onChange={e => setIsOverdueOnly(e.target.checked)}
                        className="w-[18px] h-[18px] cursor-pointer"
                    />
                    <label htmlFor="overdue" className="text-base font-bold text-primary cursor-pointer">Overdue</label>
                </div>
            </div>
        </div>
    );
};

export default ExtendBorrow;