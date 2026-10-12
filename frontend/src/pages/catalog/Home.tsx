import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { catalogService } from '../../services/catalogService';
import { borrowService } from '../../services/borrowService';
import type { Book, Member } from '../../types';
import BookShelf from '../../components/BookShelf';
import FeatureCard, { type FeatureCardProps } from '../../components/FeatureCard';

const homeFeatures: FeatureCardProps[] = [
    {
        title: 'Browse the Virtual Shelves',
        description: 'Check live copy availability, shelf locations, and summaries across every genre.',
        to: '/catalog',
        icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M8 7h8M8 11h6" />
            </svg>
        ),
    },
    {
        title: 'Order & Join Waitlists',
        description: 'Purchase permanent copies or get notified as soon as checked-out titles return.',
        to: '/trending',
        icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="m9 16 2 2 4-4" />
            </svg>
        ),
    },
    {
        title: 'Track Your Bookshelf',
        description: 'Manage your active borrows, check due dates, and review your reading history.',
        to: '/my-books',
        icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h6v14H4zM10 7h6v12h-6zM16 4h4v15h-4z" />
            </svg>
        ),
    },
];

const MemberHome: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [currentlyReading, setCurrentlyReading] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
            setBooks(results);

            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const currentMember: Member = JSON.parse(userStr);
                if (currentMember?.memberId) {
                    const borrows = await borrowService.getMemberBorrows(currentMember.memberId);
                    const borrowedBooks: Book[] = borrows.map(b => ({
                        bookId: b.bookId,
                        title: b.title,
                        author: b.author || '',
                        genre: 'FICTION' as any,
                        copiesNum: 1,
                        borrowedNum: 1,
                        keywords: '',
                        isOrdered: 'NO' as any,
                        ordersNum: 0,
                        characters: '',
                        pages: 0,
                        orderPrice: 0,
                        rating: 4.5,
                    }));
                    setCurrentlyReading(borrowedBooks);
                }
            }
        } catch (error) {
            console.error('Failed to load books', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    // slider categories
    const trending = books.filter(book => book.rating >= 4.10 && book.rating < 4.30).slice(0, 15);
    const topRated = [...books].filter(book => book.rating >= 4.30).sort((a, b) => b.rating - a.rating).slice(0, 15);
    const latestArrivals = [...books].sort((a, b) => b.bookId - a.bookId).slice(0, 15);

    return (
        <div className="flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-8 sm:py-8">
            {loading && <p className="text-sm text-muted" role="status">Loading books…</p>}
            {error && (
                <div className="flex flex-col items-start gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load books. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void fetchData()}>
                        Retry
                    </button>
                </div>
            )}
            {!loading && !error && books.length === 0 && (
                <div className="bg-surface p-6 text-primary">
                    <h2 className="text-lg font-semibold">No books are available</h2>
                    <p className="mt-2 text-sm text-muted">Try again later or browse the catalog.</p>
                    <Link className="mt-4 inline-block font-semibold text-accent-text underline underline-offset-4" to="/catalog">Browse the catalog</Link>
                </div>
            )}
            {!loading && !error && books.length > 0 && (
                <>
                    {/* Explanatory Feature Cards Above Shelves */}
                    <section aria-labelledby="welcome-heading">
                        <h2 id="welcome-heading" className="mb-3 text-lg font-bold text-primary">
                            Welcome to Blib Library
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {homeFeatures.map(feature => (
                                <FeatureCard key={feature.title} {...feature} />
                            ))}
                        </div>
                    </section>

                    {currentlyReading.length > 0 && (
                        <BookShelf title="Currently reading" books={currentlyReading} />
                    )}
                    <BookShelf title="Trending" books={trending} />
                    <BookShelf title="Top rated books" books={topRated} />
                    <BookShelf title="Latest arrivals" books={latestArrivals} />
                </>
            )}
        </div>
    );
};

export default MemberHome;