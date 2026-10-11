import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';

const BookDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieves the book passed from the SearchCatalog table click
    const selectedBook = location.state?.selectedBook as Book;

    const [status, setStatus] = useState('Checking...');
    const [shelf, setShelf] = useState('-');
    const [returnDate, setReturnDate] = useState('-');
    const [copyName, setCopyName] = useState(selectedBook?.title || '');

    useEffect(() => {
        if (!selectedBook) return;

        const fetchAvailability = async () => {
            // pulling the memberId
            const userStr = localStorage.getItem('currentUser');
            const userType = localStorage.getItem('userType');
            let memberId = 0;

            if (userStr && userType === 'MEMBER') {
                memberId = JSON.parse(userStr).membershipNumber;
            }

            try {
                // Try to fetch an available copy
                const copy = await catalogService.getAvailableCopy(selectedBook.bookId, memberId);
                setCopyName(copy.title);
                setStatus('Available');
                setShelf(copy.shelfLocation);
                setReturnDate('-');
            } catch (error: any) {
                // If 404, fallback to closest return date
                try {
                    const closest = await catalogService.getClosestReturnDate(selectedBook.bookId);
                    setCopyName(closest.title); // Using title from BorrowedBook
                    setStatus('Borrowed');
                    setShelf('-');
                    setReturnDate(closest.returnDate);
                } catch (fallbackError) {
                    setStatus('No copies found');
                    setShelf('-');
                    setReturnDate('-');
                }
            }
        };

        fetchAvailability();
    }, [selectedBook]);

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
                </section>
            </div>
        </div>
    );
};

export default BookDetails;