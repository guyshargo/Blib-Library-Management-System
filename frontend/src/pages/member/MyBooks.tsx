import React, { useEffect, useState } from 'react';
import { borrowService } from '../../services/borrowService';
import { orderService } from '../../services/orderService';
import type { BorrowedBook, Member, OrderedBook } from '../../types';

const toLocalDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDate = (value: string) => new Intl.DateTimeFormat(navigator.language).format(toLocalDate(value));

const MyBooks: React.FC = () => {
    const [member, setMember] = useState<Member | null>(null);
    const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
    const [orders, setOrders] = useState<OrderedBook[]>([]);
    const [borrowedLoading, setBorrowedLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [borrowedError, setBorrowedError] = useState(false);
    const [ordersError, setOrdersError] = useState(false);
    const [borrowedTitleFilter, setBorrowedTitleFilter] = useState('');
    const [borrowedAuthorFilter, setBorrowedAuthorFilter] = useState('');
    const [orderTitleFilter, setOrderTitleFilter] = useState('');
    const [orderAuthorFilter, setOrderAuthorFilter] = useState('');
    const [isOverdueOnly, setIsOverdueOnly] = useState(false);
    const [selectedCopyId, setSelectedCopyId] = useState<number | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [extending, setExtending] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            setBorrowedLoading(false);
            setOrdersLoading(false);
            return;
        }

        const currentMember: Member = JSON.parse(userStr);
        setMember(currentMember);
        void loadBorrowedBooks(currentMember.memberId);
        void loadOrders(currentMember.memberId);
    }, []);

    const loadBorrowedBooks = async (memberId: number) => {
        setBorrowedLoading(true);
        setBorrowedError(false);
        try {
            setBorrowedBooks(await borrowService.getMemberBorrows(memberId));
        } catch (error) {
            console.error('Failed to load borrowed books', error);
            setBorrowedError(true);
        } finally {
            setBorrowedLoading(false);
        }
    };

    const loadOrders = async (memberId: number) => {
        setOrdersLoading(true);
        setOrdersError(false);
        try {
            setOrders(await orderService.getMemberOrders(memberId));
        } catch (error) {
            console.error('Failed to load book orders', error);
            setOrdersError(true);
        } finally {
            setOrdersLoading(false);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredBooks = borrowedBooks.filter(book => {
        const matchesTitle = book.title.toLowerCase().includes(borrowedTitleFilter.trim().toLowerCase());
        const matchesAuthor = (book.author ?? '').toLowerCase().includes(borrowedAuthorFilter.trim().toLowerCase());
        const isOverdue = today > toLocalDate(book.returnDate);
        return matchesTitle && matchesAuthor && (!isOverdueOnly || isOverdue);
    });
    const filteredOrders = orders.filter(order =>
        order.title.toLowerCase().includes(orderTitleFilter.trim().toLowerCase())
        && (order.author ?? '').toLowerCase().includes(orderAuthorFilter.trim().toLowerCase())
    );
    const selectedBook = borrowedBooks.find(book => book.bookCopyId === selectedCopyId);
    const selectedReturnDate = selectedBook ? toLocalDate(selectedBook.returnDate) : null;
    const extensionWindowStart = selectedReturnDate ? new Date(selectedReturnDate) : null;
    if (extensionWindowStart) extensionWindowStart.setDate(extensionWindowStart.getDate() - 7);

    const extensionIneligibleReason = !selectedBook || !member
        ? 'Select a borrowed book to check whether it can be extended.'
        : member.freezeStatus === 'FROZEN'
            ? 'Your membership is frozen, so extensions are unavailable.'
            : today > selectedReturnDate!
                ? 'Overdue books cannot be extended.'
                : today < extensionWindowStart!
                    ? 'A book can be extended during the seven days before its due date.'
                    : '';

    const handleExtend = async () => {
        if (!member || !selectedBook || extensionIneligibleReason) return;
        if (!window.confirm(`Extend "${selectedBook.title}" by two weeks?`)) return;

        setExtending(true);
        setFeedback(null);
        try {
            await borrowService.extendBorrow(member.memberId, selectedBook.bookCopyId);
            setSelectedCopyId(null);
            await loadBorrowedBooks(member.memberId);
            setFeedback({ kind: 'success', text: `"${selectedBook.title}" was extended by two weeks.` });

            try {
                await borrowService.addActivity({
                    memberId: member.memberId,
                    activityType: 'extendBorrow',
                    entityId: selectedBook.bookId,
                });
            } catch (error) {
                console.error('Extension succeeded, but its activity could not be recorded', error);
                setFeedback({
                    kind: 'error',
                    text: 'The extension was applied, but its activity could not be recorded.',
                });
            }
        } catch (error) {
            console.error('Failed to extend borrowed book', error);
            setFeedback({
                kind: 'error',
                text: 'The extension was not approved. The book may have an active order or no longer meet the extension requirements.',
            });
        } finally {
            setExtending(false);
        }
    };

    const selectedOrder = orders.find(order => order.orderId === selectedOrderId);

    const handleCancelSelectedOrder = async () => {
        if (!member || !selectedOrder) return;
        if (!window.confirm(`Cancel the order for "${selectedOrder.title}"?`)) return;

        setCancellingOrderId(selectedOrder.orderId);
        setFeedback(null);
        try {
            const book = await orderService.getBookDetails(selectedOrder.bookId);
            await orderService.cancelOrder(selectedOrder.orderId, selectedOrder.bookId, selectedOrder.arrivalStatus);
            setSelectedOrderId(null);
            await loadOrders(member.memberId);
            setFeedback({ kind: 'success', text: `The order for "${selectedOrder.title}" was cancelled.` });

            try {
                await orderService.updateOrderStatus(book.bookId, book.ordersNum, false);
                await orderService.addActivity({
                    memberId: member.memberId,
                    activityType: 'cancelOrder',
                    entityId: selectedOrder.bookId,
                });
            } catch (error) {
                console.error('Order cancelled, but follow-up data could not be updated', error);
                setFeedback({
                    kind: 'error',
                    text: 'The order was cancelled, but its activity or book order count could not be updated.',
                });
            }
        } catch (error) {
            console.error('Failed to cancel book order', error);
            setFeedback({ kind: 'error', text: 'The order could not be cancelled. Check your connection and try again.' });
        } finally {
            setCancellingOrderId(null);
        }
    };

    const inputClass = 'w-full min-w-0 border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash';
    const buttonClass = 'inline-flex min-h-11 items-center justify-center border border-accent-border bg-surface px-4 py-2.5 text-sm font-semibold text-accent-text transition-colors can-hover:bg-accent-solid can-hover:text-inverse focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    if (!member && (borrowedLoading || ordersLoading)) {
        return (
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                <p className="text-sm text-muted" role="status">Loading your books...</p>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                <h1 className="text-3xl font-semibold tracking-tight text-primary">My Books</h1>
                <p className="mt-3 text-sm text-muted">Sign in as a member to see your borrowed books and orders.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 font-sans text-primary sm:px-8 sm:py-10">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Your library</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">My Books</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                    Review your borrowed books and order status, and manage eligible actions.
                </p>
            </header>

            {feedback && (
                <p
                    className={`border-s-4 px-4 py-3 text-sm ${
                        feedback.kind === 'success'
                            ? 'border-success-dark bg-success-subtle text-primary'
                            : 'border-danger-border bg-danger-subtle text-danger-text'
                    }`}
                    role={feedback.kind === 'error' ? 'alert' : 'status'}
                >
                    {feedback.text}
                </p>
            )}

            {/* Borrowed Books Section */}
            <section className="space-y-4" aria-labelledby="borrowed-books-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 id="borrowed-books-heading" className="text-xl font-semibold tracking-tight">Borrowed books</h2>
                        <p className="mt-1 text-sm text-muted">Select a book to check extension eligibility.</p>
                    </div>
                    <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                        <label className="min-w-48">
                            <span className="sr-only">Filter borrowed books by title</span>
                            <input
                                className={inputClass}
                                placeholder="Filter by Title"
                                value={borrowedTitleFilter}
                                onChange={event => setBorrowedTitleFilter(event.target.value)}
                            />
                        </label>
                        <label className="min-w-48">
                            <span className="sr-only">Filter borrowed books by author</span>
                            <input
                                className={inputClass}
                                placeholder="Filter by Author"
                                value={borrowedAuthorFilter}
                                onChange={event => setBorrowedAuthorFilter(event.target.value)}
                            />
                        </label>
                        <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-secondary sm:col-span-2 lg:col-span-1">
                            <input
                                type="checkbox"
                                checked={isOverdueOnly}
                                onChange={event => setIsOverdueOnly(event.target.checked)}
                                className="h-4 w-4 accent-accent-solid"
                            />
                            Overdue only
                        </label>
                    </div>
                </div>

                {borrowedLoading && <p className="text-sm text-muted" role="status">Loading borrowed books...</p>}
                {borrowedError && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                        <span>Unable to load borrowed books.</span>
                        <button type="button" className="underline underline-offset-4 font-semibold" onClick={() => void loadBorrowedBooks(member.memberId)}>Retry</button>
                    </div>
                )}

                {!borrowedLoading && !borrowedError && filteredBooks.length === 0 && (
                    <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center text-muted">
                        <p>{borrowedBooks.length ? 'No borrowed books match these filters.' : 'You have no borrowed books.'}</p>
                        {borrowedBooks.length > 0 && (
                            <button
                                type="button"
                                className="mt-2 text-sm font-semibold text-accent-text underline underline-offset-4"
                                onClick={() => {
                                    setBorrowedTitleFilter('');
                                    setBorrowedAuthorFilter('');
                                    setIsOverdueOnly(false);
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {!borrowedLoading && !borrowedError && filteredBooks.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {filteredBooks.map(book => {
                            const isSelected = selectedCopyId === book.bookCopyId;
                            const isOverdue = today > toLocalDate(book.returnDate);
                            return (
                                <div
                                    key={book.bookCopyId}
                                    onClick={() => setSelectedCopyId(book.bookCopyId)}
                                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                                        isSelected
                                            ? 'border-accent-border bg-accent-subtle shadow-sm'
                                            : 'border-border-subtle bg-surface hover:border-accent-border'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="borrowed-book-selection"
                                        aria-label={`Select ${book.title} for extension`}
                                        checked={isSelected}
                                        onChange={() => setSelectedCopyId(book.bookCopyId)}
                                        className="h-4 w-4 accent-accent-solid"
                                    />
                                    <img
                                        src={`/images/covers/${book.bookId}.jpg`}
                                        alt={book.title}
                                        onError={e => { e.currentTarget.src = '/images/book_logo.png'; }}
                                        className="h-20 w-14 shrink-0 rounded object-cover shadow-sm"
                                    />
                                    <div className="flex flex-1 flex-col justify-center min-w-0">
                                        <h3 className="truncate font-semibold text-primary">{book.title}</h3>
                                        <p className="text-sm text-secondary">{book.author || 'Author not listed'}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                                            <span>Borrowed: {formatDate(book.borrowDate)}</span>
                                            <span>•</span>
                                            <span className={isOverdue ? 'font-semibold text-danger-text' : ''}>
                                                Due: {formatDate(book.returnDate)} {isOverdue ? '· Overdue' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={`text-sm ${extensionIneligibleReason ? 'text-muted' : 'text-success-dark'}`} role="status">
                        {extensionIneligibleReason || 'This book is eligible for a two-week extension.'}
                    </p>
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={handleExtend}
                        disabled={!selectedBook || Boolean(extensionIneligibleReason) || extending}
                    >
                        {extending ? 'Extending...' : 'Extend selected book'}
                    </button>
                </div>
            </section>

            {/* Ordered Books Section */}
            <section className="space-y-4" aria-labelledby="ordered-books-heading">
                <div>
                    <h2 id="ordered-books-heading" className="text-xl font-semibold tracking-tight">Ordered books</h2>
                    <p className="mt-1 text-sm text-muted">Select an order to cancel if needed.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                        <span className="sr-only">Filter ordered books by title</span>
                        <input
                            className={inputClass}
                            placeholder="Filter by Title"
                            value={orderTitleFilter}
                            onChange={event => setOrderTitleFilter(event.target.value)}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filter ordered books by author</span>
                        <input
                            className={inputClass}
                            placeholder="Filter by Author"
                            value={orderAuthorFilter}
                            onChange={event => setOrderAuthorFilter(event.target.value)}
                        />
                    </label>
                </div>

                {ordersLoading && <p className="text-sm text-muted" role="status">Loading orders...</p>}
                {ordersError && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                        <span>Unable to load orders.</span>
                        <button type="button" className="underline underline-offset-4 font-semibold" onClick={() => void loadOrders(member.memberId)}>Retry</button>
                    </div>
                )}

                {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
                    <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center text-muted">
                        <p>{orders.length ? 'No ordered books match these filters.' : 'You have no ordered books.'}</p>
                        {orders.length > 0 && (
                            <button
                                type="button"
                                className="mt-2 text-sm font-semibold text-accent-text underline underline-offset-4"
                                onClick={() => {
                                    setOrderTitleFilter('');
                                    setOrderAuthorFilter('');
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {!ordersLoading && !ordersError && filteredOrders.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {filteredOrders.map(order => {
                            const isSelected = selectedOrderId === order.orderId;
                            const isReady = order.arrivalStatus === 'ARRIVED';
                            return (
                                <div
                                    key={order.orderId}
                                    onClick={() => setSelectedOrderId(order.orderId)}
                                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                                        isSelected
                                            ? 'border-accent-border bg-accent-subtle shadow-sm'
                                            : 'border-border-subtle bg-surface hover:border-accent-border'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="ordered-book-selection"
                                        aria-label={`Select order for ${order.title}`}
                                        checked={isSelected}
                                        onChange={() => setSelectedOrderId(order.orderId)}
                                        className="h-4 w-4 accent-accent-solid"
                                    />
                                    <img
                                        src={`/images/covers/${order.bookId}.jpg`}
                                        alt={order.title}
                                        onError={e => { e.currentTarget.src = '/images/book_logo.png'; }}
                                        className="h-20 w-14 shrink-0 rounded object-cover shadow-sm"
                                    />
                                    <div className="flex flex-1 flex-col justify-center min-w-0">
                                        <h3 className="truncate font-semibold text-primary">{order.title}</h3>
                                        <p className="text-sm text-secondary">{order.author || 'Author not listed'}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                                            <span>Ordered: {formatDate(order.orderDate)}</span>
                                            <span>•</span>
                                            <span className={`font-medium ${isReady ? 'text-success-dark' : 'text-accent-text'}`}>
                                                {isReady ? 'Ready for pickup' : 'On order'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted" role="status">
                        {selectedOrder ? `Selected order: "${selectedOrder.title}"` : 'Select an order to cancel.'}
                    </p>
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={handleCancelSelectedOrder}
                        disabled={!selectedOrder || cancellingOrderId !== null}
                    >
                        {cancellingOrderId !== null ? 'Cancelling...' : 'Cancel selected order'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default MyBooks;
