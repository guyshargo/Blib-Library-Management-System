import React, { useState } from 'react';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import type { Member } from '../../types';

const BorrowBook: React.FC = () => {
    // Member State
    const [memberIdInput, setMemberIdInput] = useState('');
    const [member, setMember] = useState<Member | null>(null);

    // Book State
    const [bookIdInput, setBookIdInput] = useState('');
    const [bookName, setBookName] = useState('');
    const [availableCopies, setAvailableCopies] = useState('');
    const [copyOfBook, setCopyOfBook] = useState<any>(null);

    const handleFindMember = async () => {
        if (!memberIdInput.trim() || !/^\d+$/.test(memberIdInput)) {
            alert("The ID must contain only digits and cannot be empty.");
            return;
        }
        try {
            const member = await librarianService.getMember(parseInt(memberIdInput));
            if (member.freezeStatus === 'FROZEN') {
                alert("Member Status Is Frozen.");
                setMember(null);
                return;
            }
            setMember(member);
        } catch (error) {
            setMember(null);
            alert("No member found with the given ID.");
        }
    };

    const handleScanMemberCard = async () => {
        const barcode = window.prompt("Scan ReaderCard Barcode\nPlease enter the barcode to scan:");
        if (!barcode || !barcode.trim()) return;

        try {
            const member = await librarianService.getMemberByBarcode(barcode.trim());
            setMemberIdInput(member.memberId.toString());
            setMember(member);
        } catch (error) {
            alert("No member found with barcode.");
        }
    };

    const handleFindBook = async () => {
        if (!bookIdInput.trim() || !member) {
            alert("Book ID cannot be empty and a member must be selected.");
            return;
        }
        try {
            const copy = await borrowService.getAvailableCopyById(parseInt(bookIdInput), member.memberId);
            setCopyOfBook(copy);
            setBookName(copy.title);

            const bookDetails = await borrowService.getBookDetails(copy.bookId);
            setAvailableCopies((bookDetails.copiesNum - bookDetails.borrowedNum).toString());
        } catch (error) {
            alert("No available copy of the book found.");
            setCopyOfBook(null);
            setBookName('');
            setAvailableCopies('');
        }
    };

    const handleScanBook = async () => {
        if (!member) return;
        const barcode = window.prompt("Scan Barcode\nPlease enter the barcode to scan:");
        if (!barcode || !barcode.trim()) return;

        try {
            const copy = await borrowService.getAvailableCopyByBarcode(barcode.trim(), member.memberId);
            setCopyOfBook(copy);
            setBookIdInput(copy.bookId.toString());
            setBookName(copy.CopyOfBookName);
        } catch (error) {
            alert("The copy is not available.");
            setCopyOfBook(null);
            setBookName('');
        }
    };

    const handleCommitBorrow = async () => {
        if (!member || !copyOfBook) return;

        try {
            // Check for late books before borrowing
            const borrows = await borrowService.getMemberBorrows(member.memberId);
            const lateBooks = borrows.filter(b => new Date(b.returnDate) < new Date());

            if (lateBooks.length > 0) {
                const lateTitles = lateBooks.map(b => `"${b.title}"`).join(',');
                alert(`The following borrowed books haven't been returned in time:\n${lateTitles}\nPlease contact the library.`);
                return;
            }

            const alreadyBorrowed = borrows.some(b => b.bookId === copyOfBook.bookId);
            if (alreadyBorrowed) {
                alert("The member has already borrowed a copy of this book.");
                return;
            }

            const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

            const payload = {
                memberId: member.memberId,
                bookCopyId: copyOfBook.copyId,
                librarianId: librarianUser.librarianId || 101,
                librarianName: librarianUser.fullName || "Librarian"
            };

            await borrowService.commitBorrow(payload);

            await borrowService.addActivity({
                memberId: member.memberId,
                type: "BORROW",
                affectedEntityId: copyOfBook.copyId
            });

            alert("Book borrowed.");

            // Reset state
            setMember(null); setMemberIdInput('');
            setCopyOfBook(null); setBookIdInput(''); setBookName(''); setAvailableCopies('');
        } catch (error: any) {
            alert(error.response?.data || "Unable to borrow this book. Check member status and copy availability, then try again.");
        }
    };

    const baseBtn = "w-full whitespace-nowrap rounded-md px-4 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";

    return (
        <div className="flex min-h-screen flex-col items-center gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <h2 className="text-xl font-bold text-primary sm:text-2xl">Library member information</h2>

            <div className="flex w-full max-w-2xl flex-col gap-5 rounded-lg bg-surface p-4 shadow-sm sm:p-5">
                <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:gap-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-base font-bold text-primary">Membership Number:</span>
                        <input className="min-w-0 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" value={memberIdInput} onChange={e => setMemberIdInput(e.target.value)} />
                    </div>
                    <button className={`${baseBtn} border border-border bg-surface text-primary can-hover:bg-surface-soft`} onClick={handleScanMemberCard}>Scan reader card</button>
                </div>
                <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:gap-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-base font-bold text-primary">Full Name:</span>
                        <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-secondary outline-none sm:text-sm" readOnly value={member?.fullName || ''} />
                    </div>
                    <button className={`${baseBtn} bg-accent-solid text-inverse can-hover:bg-accent-solid-hover`} onClick={handleFindMember}>Find member</button>
                </div>
            </div>

            <hr className="w-full border-t border-border my-5" />

            <h2 className="text-xl font-bold text-primary sm:text-2xl">Book information</h2>

            <div className="flex w-full max-w-2xl flex-col gap-5 rounded-lg bg-surface p-4 shadow-sm sm:p-5">
                <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:gap-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-base font-bold text-primary">Book ID:</span>
                        <input className="min-w-0 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash disabled:bg-surface-soft disabled:cursor-not-allowed sm:text-sm" value={bookIdInput} onChange={e => setBookIdInput(e.target.value)} disabled={!member} />
                    </div>
                    <button className={`${baseBtn} border border-border bg-surface text-primary can-hover:bg-surface-soft`} onClick={handleScanBook} disabled={!member}>Scan book</button>
                </div>
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-5">
                    <div className="flex min-w-0 flex-[2] flex-col gap-1">
                        <span className="text-base font-bold text-primary">Book Name:</span>
                        <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-secondary outline-none sm:text-sm" readOnly value={bookName} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-base font-bold text-primary">Copies:</span>
                        <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-secondary outline-none sm:text-sm" readOnly value={availableCopies} />
                    </div>
                </div>
            </div>

            <div className="mt-3 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:gap-4">
                <button className={`${baseBtn} border border-accent-border bg-surface text-accent-text can-hover:bg-accent-wash`} onClick={handleFindBook} disabled={!member || !bookIdInput}>Find book</button>
                <button className={`${baseBtn} bg-accent-solid text-inverse can-hover:bg-accent-solid-hover`} onClick={handleCommitBorrow} disabled={!member || !copyOfBook}>
                    Borrow book
                </button>
            </div>
        </div>
    );
};

export default BorrowBook;