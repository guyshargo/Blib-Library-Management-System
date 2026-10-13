import React, { useState } from 'react';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import { activityService } from '../../services/activityService';
import type { BorrowedBook, Member } from '../../types';
import FormField from '../../components/FormField';
import Button from '../../components/Button';

const toLocalDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDate = (value: string) => new Intl.DateTimeFormat(navigator.language).format(toLocalDate(value));

const toApiDate = (date: Date = new Date()) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; // dd-MM-yyyy expected by backend
};

const ReturnBook: React.FC = () => {
    const [memberIdInput, setMemberIdInput] = useState('');
    const [member, setMember] = useState<Member | null>(null);
    const [borrows, setBorrows] = useState<BorrowedBook[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!memberIdInput.trim()) return;
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleScanCard = async () => {
        const barcode = window.prompt("Scan ReaderCard Barcode\nPlease enter the barcode to scan:");
        if (!barcode || !barcode.trim()) return;

        setLoading(true);
        try {
            const foundMember = await librarianService.getMemberByBarcode(barcode.trim());
            setMember(foundMember);
            setMemberIdInput(foundMember.memberId.toString());

            const borrowsData = await borrowService.getMemberBorrows(foundMember.memberId);
            setBorrows(borrowsData);

            if (borrowsData.length === 0) {
                alert("This member has no borrowed books.");
            }
        } catch (error) {
            setMember(null);
            setBorrows([]);
            alert("No member found with barcode.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetMember = () => {
        setMember(null);
        setBorrows([]);
        setMemberIdInput('');
    };

    const handleReturn = async (book: BorrowedBook) => {
        if (!window.confirm(`Return "${book.title}"?`)) return;

        try {
            const returnDate = new Date();
            const dueDate = new Date(book.returnDate);

            const oneWeekLate = new Date(dueDate);
            oneWeekLate.setDate(oneWeekLate.getDate() + 7);

            if (returnDate > oneWeekLate) {
                await librarianService.updateFreezeStatus(book.memberId, "FROZEN", toApiDate(returnDate));
            }

            await librarianService.returnBook(book.bookCopyId, book.memberId);

            const isLate = returnDate > dueDate;
            const activityDesc = isLate ? `LATE_BOOK_RETURN` : `RETURN`;
            
            const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            await activityService.addActivity({
                memberId: book.memberId,
                type: activityDesc,
                affectedEntityId: book.bookCopyId,
                librarianId: librarianUser.librarianId
            });

            alert("Book successfully returned.");
            setBorrows(prev => prev.filter(b => b.bookCopyId !== book.bookCopyId));
        } catch (error) {
            alert("Unable to return this book. Check the connection and try again.");
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 font-sans sm:px-8 sm:py-10">
            <header className="border-b border-border-subtle pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Circulation</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Return Book</h1>
            </header>

            {/* Instructions at the Top */}
            <div className="flex items-start gap-3 rounded-2xl border border-accent-border bg-accent-subtle p-5 text-sm text-primary leading-relaxed shadow-sm">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent-text mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                </svg>
                <div>
                    <strong>Instructions:</strong> Enter a membership number or scan a reader card to load borrowed books. Click "Return Book" next to any borrowed item to process its return.
                </div>
            </div>
            
            {/* Side-by-side Layout with Instructions at Top & Unified Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Instructions & Unified Member Lookup / Info Panel */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    <div className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm">
                        {!member ? (
                            <>
                                <h2 className="text-lg font-semibold text-primary">Member Lookup</h2>
                                <FormField
                                    label="Membership Number"
                                    placeholder="Enter membership ID"
                                    value={memberIdInput}
                                    onChange={e => setMemberIdInput(e.target.value)}
                                    labelClassName="text-sm font-semibold text-secondary"
                                />
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="primary" size="lg" className="flex-1" onClick={handleSearch} disabled={loading}>
                                        {loading ? 'Finding...' : 'Find member'}
                                    </Button>
                                    <Button variant="outline" size="lg" className="flex-1" onClick={handleScanCard} disabled={loading}>
                                        Scan Card
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4 animate-fadeIn">
                                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                                    <h2 className="text-lg font-semibold text-primary">Active Member</h2>
                                    <Button variant="outline" size="sm" onClick={handleResetMember}>
                                        Change member
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-text font-bold text-lg">
                                        {member.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-primary truncate">{member.fullName}</h3>
                                        <p className="text-xs text-secondary">ID: {member.memberId}</p>
                                    </div>
                                </div>
                                <div className="pt-2 space-y-2 text-xs text-secondary">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Status:</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            member.freezeStatus === 'FROZEN' ? 'bg-danger-subtle text-danger-text' : 'bg-success-subtle text-success-dark'
                                        }`}>
                                            {member.freezeStatus}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Email:</span>
                                        <span className="font-medium text-primary truncate max-w-[200px]">{member.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">Phone:</span>
                                        <span className="font-medium text-primary">{member.phoneNum || 'Not listed'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Borrowed Books & Returns */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                            <h2 className="text-lg font-semibold text-primary">Borrowed Books</h2>
                            <span className="text-xs font-semibold text-secondary px-2.5 py-1 rounded-full bg-surface-soft">
                                {borrows.length} active {borrows.length === 1 ? 'borrow' : 'borrows'}
                            </span>
                        </div>

                        {!member ? (
                            <div className="rounded-xl border border-border-subtle bg-surface-soft p-16 text-center text-muted">
                                <p className="text-base font-semibold text-secondary">No member loaded</p>
                                <p className="text-sm mt-1">Search for a member on the left to view their borrowed books.</p>
                            </div>
                        ) : borrows.length === 0 ? (
                            <div className="rounded-xl border border-border-subtle bg-surface-soft p-16 text-center text-muted">
                                <p className="text-base font-semibold text-secondary">No borrowed books</p>
                                <p className="text-sm mt-1">This member has no active borrowed books to return.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                                {borrows.map(book => {
                                    const isOverdue = today > toLocalDate(book.returnDate);
                                    return (
                                        <div
                                            key={book.bookCopyId}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-all hover:border-accent-border"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <img
                                                    src={`/images/covers/${book.bookId}.jpg`}
                                                    alt={book.title}
                                                    onError={e => { e.currentTarget.src = '/images/book_logo.png'; }}
                                                    className="h-16 w-12 shrink-0 rounded object-cover shadow-sm"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-primary truncate">{book.title}</h3>
                                                    <p className="text-xs text-secondary mt-0.5">Copy ID: {book.bookCopyId} · {book.author || 'Author not listed'}</p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                                                        <span>Borrowed: {formatDate(book.borrowDate)}</span>
                                                        <span>•</span>
                                                        <span className={isOverdue ? 'font-semibold text-danger-text' : ''}>
                                                            Due: {formatDate(book.returnDate)} {isOverdue ? '· Overdue' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => void handleReturn(book)}
                                            >
                                                Return Book
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReturnBook;
