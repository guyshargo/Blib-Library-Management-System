import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import { activityService } from '../../services/activityService';
import type { Member } from '../../types';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

const BorrowBook: React.FC = () => {
    const location = useLocation();
    const passedBook = location.state?.selectedBook as any | undefined;
    const passedMemberId = location.state?.memberIdInput as string | undefined;

    // Member State
    const [memberIdInput, setMemberIdInput] = useState('');
    const [member, setMember] = useState<Member | null>(null);

    // Book State
    const [bookIdInput, setBookIdInput] = useState('');
    const [bookName, setBookName] = useState('');
    const [availableCopies, setAvailableCopies] = useState('');
    const [copyOfBook, setCopyOfBook] = useState<any>(null);

    useEffect(() => {
        if (passedBook) {
            setBookIdInput(passedBook.bookId.toString());
            setBookName(passedBook.title);
            setAvailableCopies(((passedBook.copiesNum ?? 0) - (passedBook.borrowedNum ?? 0)).toString());
            setCopyOfBook({ bookId: passedBook.bookId, title: passedBook.title });
        }
        if (passedMemberId && /^\d+$/.test(passedMemberId)) {
            setMemberIdInput(passedMemberId);
            void (async () => {
                try {
                    const fetchedMember = await librarianService.getMember(parseInt(passedMemberId));
                    if (fetchedMember.freezeStatus !== 'FROZEN') {
                        setMember(fetchedMember);
                        if (passedBook) {
                            try {
                                const copy = await borrowService.getAvailableCopyById(passedBook.bookId, fetchedMember.memberId);
                                setCopyOfBook(copy);
                            } catch {
                                // ignore
                            }
                        }
                    }
                } catch {
                    // ignore
                }
            })();
        }
    }, [passedBook, passedMemberId]);

    const handleFindMember = async () => {
        if (!memberIdInput.trim() || !/^\d+$/.test(memberIdInput)) {
            alert("The ID must contain only digits and cannot be empty.");
            return;
        }
        try {
            const fetchedMember = await librarianService.getMember(parseInt(memberIdInput));
            if (fetchedMember.freezeStatus === 'FROZEN') {
                alert("Member Status Is Frozen.");
                setMember(null);
                return;
            }
            setMember(fetchedMember);

            // If book ID is already entered, try resolving copy for this member
            if (bookIdInput.trim()) {
                try {
                    const bookIdNum = parseInt(bookIdInput);
                    const copy = await borrowService.getAvailableCopyById(bookIdNum, fetchedMember.memberId);
                    setCopyOfBook(copy);
                } catch {
                    // ignore if copy not available
                }
            }
        } catch (error) {
            setMember(null);
            alert("No member found with the given ID.");
        }
    };

    const handleScanMemberCard = async () => {
        const barcode = window.prompt("Scan ReaderCard Barcode\nPlease enter the barcode to scan:");
        if (!barcode || !barcode.trim()) return;

        try {
            const fetchedMember = await librarianService.getMemberByBarcode(barcode.trim());
            setMemberIdInput(fetchedMember.memberId.toString());
            setMember(fetchedMember);

            if (bookIdInput.trim()) {
                try {
                    const bookIdNum = parseInt(bookIdInput);
                    const copy = await borrowService.getAvailableCopyById(bookIdNum, fetchedMember.memberId);
                    setCopyOfBook(copy);
                } catch {
                    // ignore
                }
            }
        } catch (error) {
            alert("No member found with barcode.");
        }
    };

    const handleFindBook = async () => {
        if (!bookIdInput.trim() || !/^\d+$/.test(bookIdInput)) {
            alert("Book ID cannot be empty and must contain only digits.");
            return;
        }
        try {
            const bookIdNum = parseInt(bookIdInput);
            // Fetch book details directly to show title and available copies immediately
            const bookDetails = await borrowService.getBookDetails(bookIdNum);
            setBookName(bookDetails.title);
            setAvailableCopies((bookDetails.copiesNum - bookDetails.borrowedNum).toString());

            if (member) {
                try {
                    const copy = await borrowService.getAvailableCopyById(bookIdNum, member.memberId);
                    setCopyOfBook(copy);
                } catch {
                    setCopyOfBook({ bookId: bookIdNum, title: bookDetails.title });
                }
            } else {
                setCopyOfBook({ bookId: bookIdNum, title: bookDetails.title });
            }
        } catch (error) {
            alert("No book found with the given ID.");
            setCopyOfBook(null);
            setBookName('');
            setAvailableCopies('');
        }
    };

    const handleScanBook = async () => {
        const barcode = window.prompt("Scan Barcode\nPlease enter the barcode to scan:");
        if (!barcode || !barcode.trim()) return;

        try {
            const bookIdNum = parseInt(barcode.trim());
            if (isNaN(bookIdNum)) {
                alert("Invalid barcode.");
                return;
            }
            setBookIdInput(barcode.trim());
            const bookDetails = await borrowService.getBookDetails(bookIdNum);
            setBookName(bookDetails.title);
            setAvailableCopies((bookDetails.copiesNum - bookDetails.borrowedNum).toString());

            if (member) {
                try {
                    const copy = await borrowService.getAvailableCopyById(bookIdNum, member.memberId);
                    setCopyOfBook(copy);
                } catch {
                    setCopyOfBook({ bookId: bookIdNum, title: bookDetails.title });
                }
            } else {
                setCopyOfBook({ bookId: bookIdNum, title: bookDetails.title });
            }
        } catch (error) {
            alert("The book or copy could not be found.");
            setCopyOfBook(null);
            setBookName('');
            setAvailableCopies('');
        }
    };

    const handleCommitBorrow = async () => {
        if (!member) {
            alert("Please find or scan a member first.");
            return;
        }
        if (!bookIdInput.trim()) {
            alert("Please enter or scan a book ID.");
            return;
        }

        try {
            const bookIdNum = parseInt(bookIdInput);
            let targetCopy = copyOfBook;
            if (!targetCopy || !targetCopy.copyId) {
                targetCopy = await borrowService.getAvailableCopyById(bookIdNum, member.memberId);
                setCopyOfBook(targetCopy);
            }

            // Check for late books before borrowing
            const borrows = await borrowService.getMemberBorrows(member.memberId);
            const lateBooks = borrows.filter(b => new Date(b.returnDate) < new Date());

            if (lateBooks.length > 0) {
                const lateTitles = lateBooks.map(b => `"${b.title}"`).join(',');
                alert(`The following borrowed books haven't been returned in time:\n${lateTitles}\nPlease contact the library.`);
                return;
            }

            const alreadyBorrowed = borrows.some(b => b.bookId === bookIdNum);
            if (alreadyBorrowed) {
                alert("The member has already borrowed a copy of this book.");
                return;
            }

            const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

            const payload = {
                memberId: member.memberId,
                bookCopyId: targetCopy.copyId,
                librarianId: librarianUser.librarianId || 101,
                librarianName: librarianUser.fullName || "Librarian"
            };

            await borrowService.commitBorrow(payload);

            await activityService.addActivity({
                memberId: member.memberId,
                type: "BORROW",
                affectedEntityId: targetCopy.copyId,
                librarianId: librarianUser.librarianId
            });

            alert("Book borrowed successfully.");

            // Reset state
            setMember(null); setMemberIdInput('');
            setCopyOfBook(null); setBookIdInput(''); setBookName(''); setAvailableCopies('');
        } catch (error: any) {
            alert(error.response?.data || "Unable to borrow this book. Check member status and copy availability, then try again.");
        }
    };

    const isReadyToBorrow = Boolean(member && bookIdInput.trim() && bookName);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 font-sans sm:px-8 sm:py-10">
            <header className="border-b border-border-subtle pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Circulation</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Borrow Book</h1>
            </header>

            {/* Instruction Banner */}
            <div className="flex items-center gap-3 rounded-xl border border-accent-border bg-accent-subtle p-4 text-sm text-primary">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent-text" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span><strong>Instruction:</strong> Scan or enter a book ID to load book details, and enter or scan a member card to verify membership. Complete borrow when both are ready.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Member Information Section */}
                <section className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-primary">1. Library member information</h2>

                    <FormField
                        label="Membership Number"
                        placeholder="Enter or scan membership ID"
                        value={memberIdInput}
                        onChange={e => setMemberIdInput(e.target.value)}
                        labelClassName="text-sm font-semibold text-secondary"
                        actionButton={
                            <div className="flex gap-2">
                                <Button variant="primary" onClick={handleFindMember}>
                                    Find member
                                </Button>
                                <Button variant="secondary" onClick={handleScanMemberCard}>
                                    Scan card
                                </Button>
                            </div>
                        }
                    />

                    <FormField
                        label="Full Name"
                        value={member?.fullName || ''}
                        readOnly
                        placeholder="Member name will appear here"
                        labelClassName="text-sm font-semibold text-secondary"
                    />
                </section>

                {/* Book Information Section */}
                <section className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-primary">2. Book information</h2>

                    <FormField
                        label="Book ID / Barcode"
                        placeholder="Enter or scan book ID"
                        value={bookIdInput}
                        onChange={e => setBookIdInput(e.target.value)}
                        labelClassName="text-sm font-semibold text-secondary"
                        actionButton={
                            <div className="flex gap-2">
                                <Button variant="primary" onClick={handleFindBook}>
                                    Find book
                                </Button>
                                <Button variant="secondary" onClick={handleScanBook}>
                                    Scan book
                                </Button>
                            </div>
                        }
                    />

                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                        <FormField
                            label="Book Title"
                            value={bookName}
                            readOnly
                            placeholder="Book title"
                            labelClassName="text-sm font-semibold text-secondary"
                        />
                        <FormField
                            label="Available Copies"
                            value={availableCopies}
                            readOnly
                            placeholder="0"
                            labelClassName="text-sm font-semibold text-secondary"
                        />
                    </div>
                </section>
            </div>

            {/* Commit Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
                <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    onClick={handleCommitBorrow}
                    disabled={!isReadyToBorrow}
                >
                    Complete borrow
                </Button>
            </div>
        </div>
    );
};

export default BorrowBook;
