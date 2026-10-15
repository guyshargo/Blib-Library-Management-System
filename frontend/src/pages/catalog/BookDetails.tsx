import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import { activityService } from '../../services/activityService';
import { orderService } from '../../services/orderService';
import { waitlistService } from '../../services/waitlistService';
import { Tag } from '../../components/ui/Tag';
import { Button, BookActionCard } from '../../components/ui/Button';
import type { Book, Member, OrderRequest } from '../../types';

type MemberWithBackendFields = Member & {
    phoneNumber?: string;
    emailAddress?: string;
};

const BookDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const queryBookId = searchParams.get('id') || searchParams.get('bookId');

    // Retrieves the book passed from state or query param
    const initialBook = location.state?.selectedBook as Book;
    const [selectedBook, setSelectedBook] = useState<Book | null>(initialBook || null);
    const [loading, setLoading] = useState(true);

    const [shelf, setShelf] = useState('-');
    const [returnDate, setReturnDate] = useState('-');
    const [copyName, setCopyName] = useState(initialBook?.title || '');
    const [member, setMember] = useState<Member | null>(null);
    const [userType] = useState(localStorage.getItem('userType'));
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchBookAndAvailability = async () => {
            setLoading(true);
            let activeBook: Book | null = initialBook || null;

            try {
                const bookIdToFetch = initialBook?.bookId || (queryBookId ? Number(queryBookId) : 1);
                if (bookIdToFetch) {
                    const fullBook = await catalogService.getBook(bookIdToFetch);
                    if (fullBook) {
                        activeBook = fullBook;
                        setSelectedBook(fullBook);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch full book details', err);
            } finally {
                setLoading(false);
            }

            if (!activeBook) return;

            setCopyName(activeBook.title);

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

            const availableCopies = Math.max(0, (activeBook.copiesNum || 0) - (activeBook.borrowedNum || 0));

            if (availableCopies > 0) {
                try {
                    const copy = await catalogService.getAvailableCopy(activeBook.bookId, memberId);
                    setCopyName(copy.title || activeBook.title);
                    setShelf(copy.shelfLocation || 'Main Shelf');
                    setReturnDate('-');
                } catch {
                    setShelf('General Stacks');
                    setReturnDate('-');
                }
            } else {
                try {
                    const closest = await catalogService.getClosestReturnDate(activeBook.bookId);
                    setCopyName(closest.title || activeBook.title);
                    setShelf('-');
                    setReturnDate(closest.returnDate);
                } catch {
                    setShelf('-');
                    setReturnDate('-');
                }
            }
        };

        void fetchBookAndAvailability();
    }, [initialBook?.bookId, queryBookId]);

    const handleOrder = async () => {
        if (!selectedBook || !member) return;
        if (member.freezeStatus === 'FROZEN') {
            setFeedback({ kind: 'error', text: 'Your membership is frozen, so you cannot place an order.' });
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

            setFeedback({ kind: 'success', text: `"${selectedBook.title}" order has been registered.` });
            try {
                await activityService.addActivity({
                    memberId: member.memberId,
                    type: 'ORDER',
                    affectedEntityId: selectedBook.bookId,
                });
            } catch (error) {
                console.error('Order placed, but activity could not be recorded', error);
            }
        } catch (error) {
            console.error('Failed to place book order', error);
            setFeedback({ kind: 'error', text: 'The order could not be placed. Please try again.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleWaitlist = async () => {
        if (!selectedBook || !member) return;
        if (member.freezeStatus === 'FROZEN') {
            setFeedback({ kind: 'error', text: 'Your membership is frozen, so you cannot join the waitlist.' });
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
            await waitlistService.joinWaitlist(orderRequest);
            setFeedback({ kind: 'success', text: `You have successfully joined the waitlist for "${selectedBook.title}". We will notify your email (${member.email}) and phone (${member.phoneNum}) when a copy becomes available.` });
        } catch (error: any) {
            console.error('Failed to join waitlist', error);
            const errMsg = error.response?.data || 'You are already on the waitlist or unable to join.';
            setFeedback({ kind: 'error', text: typeof errMsg === 'string' ? errMsg : 'Failed to join waitlist.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center font-sans">
                <p className="text-sm font-medium text-muted">Loading book details...</p>
            </div>
        );
    }

    if (!selectedBook) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center font-sans">
                <div className="rounded-2xl border border-border-subtle bg-surface p-8 shadow-sm max-w-md w-full">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-wash text-accent-text mb-4">
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                            <path d="M6 6h10" />
                            <path d="M6 10h10" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-primary mb-2">No book selected</h2>
                    <p className="text-sm text-secondary mb-6">Choose a title from the catalog to view details, check availability, or place an order.</p>
                    <button 
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-accent-solid px-5 py-2.5 text-sm font-semibold text-inverse shadow-sm transition-transform duration-150 ease-out can-hover:bg-accent-solid-hover enabled:active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2"
                        onClick={() => navigate(-1)}
                    >
                        Return to Catalog
                    </button>
                </div>
            </div>
        );
    }

    const availableCopies = Math.max(0, (selectedBook.copiesNum || 0) - (selectedBook.borrowedNum || 0));
    const availablePercentage = selectedBook.copiesNum > 0
        ? Math.min(100, Math.round((availableCopies / selectedBook.copiesNum) * 100))
        : 0;

    const characterList = selectedBook.characters && selectedBook.characters !== 'None listed'
        ? selectedBook.characters.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    const keywordList = selectedBook.keywords
        ? selectedBook.keywords.split(',').map(item => item.trim()).filter(Boolean)
        : [];

    return (
        <div className="mx-auto max-w-6xl p-4 font-sans text-primary sm:p-6 lg:p-8">
            {/* Top Navigation Bar */}
            <nav className="mb-6 flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    <span>Back to catalog</span>
                </Button>
            </nav>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 items-start">
                {/* Left Column: Book Cover & Shelf Location Card */}
                <aside className="flex flex-col items-center gap-5 md:items-start">
                    <div className="relative w-full max-w-[220px] lg:max-w-[250px] overflow-hidden rounded-lg bg-surface shadow-[0_12px_24px_-4px_rgba(0,0,0,0.18),0_4px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-black/10">
                        <img
                            src={`/images/covers/${selectedBook.bookId}.jpg`}
                            alt={`Cover of ${selectedBook.title}`}
                            onError={event => {
                                event.currentTarget.src = '/images/book_logo.png';
                            }}
                            className="aspect-[2/3] w-full object-cover"
                        />
                    </div>

                    {/* Quick Circulation Snapshot Card */}
                    <div className="w-full max-w-[220px] lg:max-w-[250px] rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <span 
                                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                    availableCopies > 0 
                                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                                        : 'bg-amber-500 ring-4 ring-amber-500/20'
                                }`} 
                            />
                            <div className="min-w-0">
                                <span className="block text-xs font-medium text-muted">Availability</span>
                                <span className="block text-sm font-bold text-primary truncate">
                                    {availableCopies > 0 ? 'Available' : 'All Checked Out'}
                                </span>
                            </div>
                        </div>

                        {availableCopies > 0 && (
                            <div className="mt-3.5 border-t border-border-subtle pt-3 flex items-center justify-between text-xs">
                                <span className="text-secondary font-medium flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="5" x="2" y="3" rx="1" />
                                        <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                                        <path d="M10 12h4" />
                                    </svg>
                                    Shelf Location
                                </span>
                                <span className="rounded bg-accent-wash px-2 py-0.5 font-semibold text-accent-text">{shelf}</span>
                            </div>
                        )}

                        {availableCopies === 0 && returnDate !== '-' && (
                            <div className="mt-3.5 border-t border-border-subtle pt-3 flex items-center justify-between text-xs">
                                <span className="text-secondary font-medium flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                        <line x1="16" x2="16" y1="2" y2="6" />
                                        <line x1="8" x2="8" y1="2" y2="6" />
                                        <line x1="3" x2="21" y1="10" y2="10" />
                                    </svg>
                                    Expected Due
                                </span>
                                <span className="font-semibold text-primary">{returnDate}</span>
                            </div>
                        )}
                    </div>

                    {userType === 'LIBRARIAN' && (
                        <div className="w-full max-w-[220px] lg:max-w-[250px] space-y-2">
                            <button
                                type="button"
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-accent-border bg-accent-solid px-4 py-2.5 text-sm font-semibold text-inverse shadow-sm transition-transform duration-150 ease-out can-hover:bg-accent-solid-hover enabled:active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => navigate('/borrow-book', { state: { selectedBook } })}
                                disabled={availableCopies === 0}
                            >
                                Open Borrow Desk
                            </button>
                            {availableCopies === 0 && (
                                <p className="text-[11px] text-muted text-center">
                                    All copies checked out.
                                </p>
                            )}
                        </div>
                    )}

                    {userType === 'MEMBER' && availableCopies > 0 && (
                        <BookActionCard
                            title="Purchase a copy"
                            description={`Order a permanent copy${selectedBook.orderPrice != null ? ` for $${Number(selectedBook.orderPrice).toFixed(2)}` : ''}.`}
                            buttonLabel="Purchase Copy"
                            onAction={() => void handleOrder()}
                            disabled={actionLoading || !member}
                            actionLoading={actionLoading}
                        />
                    )}

                    {userType === 'MEMBER' && availableCopies === 0 && (
                        <BookActionCard
                            title="Join title waitlist"
                            description="All copies are currently checked out. Join the waitlist to be notified when a copy is returned."
                            buttonLabel="Join Waitlist"
                            onAction={() => void handleWaitlist()}
                            disabled={actionLoading || !member}
                            actionLoading={actionLoading}
                        />
                    )}

                    {/* Status Feedback Notification */}
                    {feedback && (
                        <div
                            className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm w-full ${
                                feedback.kind === 'success'
                                    ? 'border-success-dark/30 bg-success-subtle text-primary'
                                    : 'border-danger-border/40 bg-danger-subtle text-danger-text'
                            }`}
                            role={feedback.kind === 'error' ? 'alert' : 'status'}
                        >
                            <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {feedback.kind === 'success' ? (
                                    <>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </>
                                ) : (
                                    <>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" x2="12" y1="8" y2="12" />
                                        <line x1="12" x2="12.01" y1="16" y2="16" />
                                    </>
                                )}
                            </svg>
                            <p className="font-medium leading-relaxed">{feedback.text}</p>
                        </div>
                    )}
                </aside>

                {/* Right Column: Book Details & Actions */}
                <section className="min-w-0 w-full">
                    <header className="space-y-1.5">
                        <h1 className="break-words text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl leading-tight">
                            {selectedBook.title}
                        </h1>
                        <p className="text-base sm:text-lg text-secondary font-medium">
                            by{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/search', { state: { initialSearch: selectedBook.author } })}
                                className="text-primary font-semibold underline underline-offset-2 can-hover:text-accent-text transition-colors cursor-pointer inline"
                            >
                                {selectedBook.author || 'Author not listed'}
                            </button>
                        </p>

                        {/* Rating & Pages Sub-section */}
                        {(selectedBook.rating != null || selectedBook.pages) && (
                            <div className="mt-1.5 flex items-center gap-2 text-xs sm:text-sm text-secondary">
                                {selectedBook.rating != null && (
                                    <span className="flex items-center gap-1.5 font-medium text-primary">
                                        <span className="flex items-center gap-0.5">
                                            {Array.from({ length: Math.floor(Number(selectedBook.rating)) }).map((_, i) => (
                                                <svg key={i} className="h-4 w-4 fill-amber-500 text-amber-500 inline" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </span>
                                        <span>{Number(selectedBook.rating).toFixed(2)}</span>
                                    </span>
                                )}
                                {selectedBook.rating != null && selectedBook.pages && (
                                    <span className="text-muted">•</span>
                                )}
                                {selectedBook.pages && (
                                    <span className="font-medium text-secondary">{selectedBook.pages} pages</span>
                                )}
                            </div>
                        )}

                        {copyName !== selectedBook.title && availableCopies > 0 && (
                            <p className="inline-block rounded-md bg-surface-soft px-2.5 py-1 text-xs text-muted border border-border-subtle mt-1">
                                Available copy edition: <span className="font-medium text-secondary">{copyName}</span>
                            </p>
                        )}
                    </header>



                    {/* Unified Library Holdings & Circulation Panel */}
                    <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm w-full">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3.5">
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-accent-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="7" height="7" x="3" y="3" rx="1" />
                                    <rect width="7" height="7" x="14" y="3" rx="1" />
                                    <rect width="7" height="7" x="14" y="14" rx="1" />
                                    <rect width="7" height="7" x="3" y="14" rx="1" />
                                </svg>
                                <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Circulation & Holdings</h2>
                            </div>
                            <span className="text-xs font-medium text-secondary">
                                {availableCopies > 0 ? `${availableCopies} of ${selectedBook.copiesNum} copies on shelf` : 'All copies currently checked out'}
                            </span>
                        </div>

                        {/* Availability Capacity Bar */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                                <span>Copy Distribution</span>
                                <span className="font-semibold text-primary">{availablePercentage}% Available</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border-subtle/40 flex">
                                <div 
                                    className="bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${availablePercentage}%` }}
                                    title={`${availableCopies} Available`}
                                />
                                <div 
                                    className="bg-accent-solid/40 transition-all duration-300"
                                    style={{ width: `${100 - availablePercentage}%` }}
                                    title={`${selectedBook.borrowedNum} Borrowed`}
                                />
                            </div>
                        </div>

                        {/* Circulation Metrics Row */}
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-lg bg-surface-soft p-3">
                                <span className="block text-xs text-muted">Available</span>
                                <span className="mt-0.5 block text-lg font-bold text-emerald-600">{availableCopies}</span>
                                <span className="text-[11px] text-muted">Ready to borrow</span>
                            </div>
                            <div className="rounded-lg bg-surface-soft p-3">
                                <span className="block text-xs text-muted">Borrowed</span>
                                <span className="mt-0.5 block text-lg font-bold text-primary">{selectedBook.borrowedNum}</span>
                                <span className="text-[11px] text-muted">On loan</span>
                            </div>
                            <div className="rounded-lg bg-surface-soft p-3">
                                <span className="block text-xs text-muted">Total Copies</span>
                                <span className="mt-0.5 block text-lg font-bold text-primary">{selectedBook.copiesNum}</span>
                                <span className="text-[11px] text-muted">In branch</span>
                            </div>
                            <div className="rounded-lg bg-surface-soft p-3">
                                <span className="block text-xs text-muted">Status</span>
                                <span className="mt-0.5 block text-sm font-bold text-primary truncate">
                                    {availableCopies > 0 ? 'On Shelf' : 'Waitlist Active'}
                                </span>
                                <span className="text-[11px] text-muted">{availableCopies > 0 ? 'Ready' : 'Queue open'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Book Synopsis */}
                    <section className="mt-8 w-full">
                        <h2 className="text-base font-bold text-primary tracking-tight">About this book</h2>
                        <div className="mt-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm w-full">
                            <p className="whitespace-pre-line text-base leading-relaxed text-secondary w-full">
                                {selectedBook.summary || 'No summary is available for this title.'}
                            </p>
                        </div>
                    </section>

                    {/* Genres, Characters & Keywords Pill Chips */}
                    {(selectedBook.genre || characterList.length > 0 || keywordList.length > 0) && (
                        <div className="mt-8 space-y-5 border-t border-border-subtle pt-6 w-full">
                            {selectedBook.genre && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">GENRES</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Tag 
                                            key={selectedBook.genre} 
                                            label={selectedBook.genre} 
                                            variant="character" 
                                            icon={<span className="h-1.5 w-1.5 rounded-full bg-accent-border/60" />}
                                        />   
                                    </div>
                                </div>
                            )}

                            {characterList.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">Key Characters</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {characterList.map(char => (
                                            <Tag 
                                                key={char} 
                                                label={char} 
                                                variant="character" 
                                                icon={<span className="h-1.5 w-1.5 rounded-full bg-accent-border/60" />}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {keywordList.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">Topics & Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {keywordList.map(tag => (
                                            <Tag 
                                                key={tag} 
                                                label={tag} 
                                                variant="topic" 
                                                icon={<span className="text-accent-text font-semibold">#</span>}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default BookDetails;