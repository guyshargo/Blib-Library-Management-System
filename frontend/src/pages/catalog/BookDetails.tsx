import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import { borrowService } from '../../services/borrowService';
import { librarianService } from '../../services/librarianService';
import { orderService } from '../../services/orderService';
import type { Book, BorrowRequest, Member, OrderRequest } from '../../types';

type MemberWithBackendFields = Member & {
    phoneNumber?: string;
    emailAddress?: string;
};

type LibrarianSession = {
    librarianId?: number;
    fullName?: string;
};

const toLocalDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const BookDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieves the book passed from the SearchCatalog table click
    const selectedBook = location.state?.selectedBook as Book;

    const [status, setStatus] = useState('Checking...');
    const [shelf, setShelf] = useState('-');
    const [returnDate, setReturnDate] = useState('-');
    const [copyName, setCopyName] = useState(selectedBook?.title || '');
    const [member, setMember] = useState<Member | null>(null);
    const [userType, setUserType] = useState(localStorage.getItem('userType'));
    const [memberIdInput, setMemberIdInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!selectedBook) return;

        const fetchAvailability = async () => {
            const userStr = localStorage.getItem('currentUser');
            let memberId = 0;

            if (userStr && localStorage.getItem('userType') === 'MEMBER') {
                const storedMember = JSON.parse(userStr) as MemberWithBackendFields;
                const normalizedMember: Member = {
                    ...storedMember,
                    phoneNum: storedMember.phoneNum ?? storedMember.phoneNumber ?? '',
                    email: storedMember.email ?? storedMember.emailAddress ?? '',
                };
                memberId = normalizedMember.memberId;
                setMember(normalizedMember);
            } else {
                setMember(null);
            }

            try {
                const copy = await catalogService.getAvailableCopy(selectedBook.bookId, memberId);
                setCopyName(copy.title || selectedBook.title);
                setStatus('Available');
                setShelf(copy.shelfLocation);
                setReturnDate('-');
            } catch {
                try {
                    const closest = await catalogService.getClosestReturnDate(selectedBook.bookId);
                    setCopyName(closest.title);
                    setStatus('Borrowed');
                    setShelf('-');
                    setReturnDate(closest.returnDate);
                } catch {
                    setStatus('No copies found');
                    setShelf('-');
                    setReturnDate('-');
                }
            }
        };

        fetchAvailability();
    }, [selectedBook]);

    const handleOrder = async () => {
        if (!selectedBook || !member) return;
        if (member.freezeStatus === 'FROZEN') {
            setFeedback({ kind: 'error', text: 'Your membership is frozen, so you cannot place an order.' });
            return;
        }
        if (selectedBook.copiesNum <= selectedBook.ordersNum) {
            setFeedback({ kind: 'error', text: `${selectedBook.title} has reached its order limit.` });
            return;
        }

        setActionLoading(true);
        setFeedback(null);
        try {
            const orderRequest: OrderRequest = {
                bookId: selectedBook.bookId,
                memberId: member.memberId,
                memberName: member.fullName,
                memberPhone: member.phoneNum,
                memberEmail: member.email,
            };
            const result = await orderService.orderBook(orderRequest);
            if (result !== 'approve') {
                setFeedback({ kind: 'error', text: `The order could not be placed: ${result}` });
                return;
            }

            setFeedback({ kind: 'success', text: `"${selectedBook.title}" has been ordered.` });
            let followUpFailed = false;
            try {
                await orderService.updateOrderStatus(selectedBook.bookId, selectedBook.ordersNum, true);
            } catch (error) {
                followUpFailed = true;
                console.error('Book ordered, but its order count could not be updated', error);
            }
            try {
                await orderService.addActivity({
                    memberId: member.memberId,
                    activityType: 'order',
                    entityId: selectedBook.bookId,
                });
            } catch (error) {
                followUpFailed = true;
                console.error('Book ordered, but its activity could not be recorded', error);
            }
            if (followUpFailed) {
                setFeedback({
                    kind: 'error',
                    text: `"${selectedBook.title}" was ordered, but some follow-up details could not be updated.`,
                });
            }
        } catch (error) {
            console.error('Failed to place book order', error);
            setFeedback({ kind: 'error', text: 'The order could not be placed. Please try again.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleBorrow = async () => {
        const memberId = Number(memberIdInput);
        if (!Number.isInteger(memberId) || memberId <= 0) {
            setFeedback({ kind: 'error', text: 'Enter a valid membership number.' });
            return;
        }

        const sessionStr = localStorage.getItem('currentUser');
        const librarian = sessionStr ? JSON.parse(sessionStr) as LibrarianSession : null;
        if (!librarian?.librarianId || !librarian.fullName) {
            setFeedback({ kind: 'error', text: 'Sign in as a librarian to record a borrow.' });
            return;
        }

        setActionLoading(true);
        setFeedback(null);
        try {
            const targetMember = await librarianService.getMember(memberId);
            if (targetMember.freezeStatus === 'FROZEN') {
                setFeedback({ kind: 'error', text: 'This membership is frozen and cannot borrow books.' });
                return;
            }

            const currentBorrows = await borrowService.getMemberBorrows(memberId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lateBooks = currentBorrows.filter(book => toLocalDate(book.returnDate) < today);
            if (lateBooks.length > 0) {
                setFeedback({
                    kind: 'error',
                    text: `This member has overdue books: ${lateBooks.map(book => `"${book.title}"`).join(', ')}.`,
                });
                return;
            }

            const copy = await borrowService.getAvailableCopyById(selectedBook.bookId, memberId);
            const borrowRequest: BorrowRequest = {
                memberId,
                bookCopyId: copy.copyId,
                librarianId: librarian.librarianId,
                librarianName: librarian.fullName,
            };
            await borrowService.commitBorrow(borrowRequest);

            try {
                await borrowService.addActivity({
                    memberId,
                    activityType: 'borrow',
                    entityId: copy.copyId,
                });
                setFeedback({ kind: 'success', text: `"${selectedBook.title}" was borrowed for ${targetMember.fullName}.` });
            } catch (error) {
                console.error('Borrow succeeded, but its activity could not be recorded', error);
                setFeedback({
                    kind: 'error',
                    text: `"${selectedBook.title}" was borrowed, but its activity could not be recorded.`,
                });
            }
        } catch (error) {
            console.error('Failed to borrow book', error);
            setFeedback({ kind: 'error', text: 'The book could not be borrowed. Check the member and copy availability.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (!selectedBook) {
        return (
            <div className="flex flex-col items-center p-[30px] font-sans min-h-screen">
                <h2 className="text-2xl font-bold mb-4">No book selected.</h2>
                <button 
                    className="bg-accent-subtle rounded-full text-primary text-lg font-semibold border-2 border-transparent px-[25px] py-2 transition-all duration-200 hover:bg-accent-subtle-hover hover:text-primary hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]"
                    onClick={() => navigate(-1)}
                >
                    Return
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 font-sans text-primary sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
                <aside className="flex flex-col items-center gap-4 md:items-start">
                    <img
                        src={`/images/covers/${selectedBook.bookId}.jpg`}
                        alt={`Cover of ${selectedBook.title}`}
                        onError={event => {
                            event.currentTarget.src = '/images/book_logo.png';
                        }}
                        className="w-full max-w-[200px] rounded-[3px] object-cover shadow-[3px_5px_10px_rgba(0,0,0,0.25)]"
                    />
                    <div className="w-full max-w-[200px] space-y-3">
                        <div className="rounded-md border border-border-subtle bg-surface-soft px-4 py-3 text-sm">
                            <span className="font-semibold text-secondary">Availability</span>
                            <p className="mt-1 text-base font-semibold text-primary">{status}</p>
                        </div>
                        {status === 'Available' && (
                            <div className="rounded-md border border-border-subtle bg-surface-soft px-4 py-3 text-sm">
                                <span className="font-semibold text-secondary">Shelf location</span>
                                <p className="mt-1 text-base text-primary">{shelf}</p>
                            </div>
                        )}
                        {status === 'Borrowed' && (
                            <div className="rounded-md border border-border-subtle bg-surface-soft px-4 py-3 text-sm">
                                <span className="font-semibold text-secondary">Expected return</span>
                                <p className="mt-1 text-base text-primary">{returnDate}</p>
                            </div>
                        )}
                    </div>
                </aside>

                <section className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-wide text-accent-text">{selectedBook.genre}</p>
                    <h1 className="mt-2 break-words text-3xl font-bold leading-tight text-primary sm:text-4xl">
                        {selectedBook.title}
                    </h1>
                    <p className="mt-2 text-base text-secondary">
                        by: {selectedBook.author || 'Author not listed'}
                    </p>
                    {copyName !== selectedBook.title && (
                        <p className="mt-2 text-sm text-muted">Available copy: {copyName}</p>
                    )}

                    <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-md border border-border-subtle px-4 py-3">
                            <dt className="text-sm text-muted">Total copies</dt>
                            <dd className="mt-1 font-semibold text-primary">{selectedBook.copiesNum}</dd>
                        </div>
                        <div className="rounded-md border border-border-subtle px-4 py-3">
                            <dt className="text-sm text-muted">Borrowed copies</dt>
                            <dd className="mt-1 font-semibold text-primary">{selectedBook.borrowedCopiesNum}</dd>
                        </div>
                        <div className="rounded-md border border-border-subtle px-4 py-3">
                            <dt className="text-sm text-muted">Orders</dt>
                            <dd className="mt-1 font-semibold text-primary">{selectedBook.ordersNum}</dd>
                        </div>
                    </dl>

                    <section className="mt-8">
                        <h2 className="text-lg font-semibold text-primary">About this book</h2>
                        <p className="mt-3 whitespace-pre-line text-base leading-7 text-secondary">
                            {selectedBook.summary || 'No summary is available for this book.'}
                        </p>
                    </section>

                    {selectedBook.keywords && (
                        <section className="mt-7">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Keywords</h2>
                            <p className="mt-2 break-words text-sm text-secondary">{selectedBook.keywords}</p>
                        </section>
                    )}

                    {userType === 'MEMBER' && (
                        <section className="mt-8 border-t border-border-subtle pt-6">
                            <h2 className="text-lg font-semibold text-primary">Order this book</h2>
                            <p className="mt-1 text-sm text-muted">Place an order for this title using your membership.</p>
                            <button
                                type="button"
                                className="mt-4 inline-flex min-h-11 items-center justify-center border border-accent-border bg-accent-solid px-5 py-2.5 text-sm font-semibold text-inverse transition-colors hover:bg-accent-solid-hover focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => void handleOrder()}
                                disabled={actionLoading || !member}
                            >
                                {actionLoading ? 'Processing...' : 'Order this book'}
                            </button>
                        </section>
                    )}

                    {userType === 'LIBRARIAN' && (
                        <section className="mt-8 border-t border-border-subtle pt-6">
                            <h2 className="text-lg font-semibold text-primary">Borrow this book</h2>
                            <p className="mt-1 text-sm text-muted">Record a borrow for a library member.</p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                                <label className="flex-1 space-y-2">
                                    <span className="block text-sm font-semibold text-secondary">Membership number</span>
                                    <input
                                        className="w-full border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash"
                                        inputMode="numeric"
                                        value={memberIdInput}
                                        onChange={event => setMemberIdInput(event.target.value)}
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="inline-flex min-h-11 items-center justify-center border border-accent-border bg-accent-solid px-5 py-2.5 text-sm font-semibold text-inverse transition-colors hover:bg-accent-solid-hover focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => void handleBorrow()}
                                    disabled={actionLoading || status !== 'Available'}
                                >
                                    {actionLoading ? 'Processing...' : 'Borrow for member'}
                                </button>
                            </div>
                        </section>
                    )}

                    {feedback && (
                        <p
                            className={`mt-5 border-s-4 px-4 py-3 text-sm ${
                                feedback.kind === 'success'
                                    ? 'border-success-dark bg-success-subtle text-primary'
                                    : 'border-danger-border bg-danger-subtle text-danger-text'
                            }`}
                            role={feedback.kind === 'error' ? 'alert' : 'status'}
                        >
                            {feedback.text}
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default BookDetails;