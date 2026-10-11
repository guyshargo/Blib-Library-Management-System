import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';
import BookShelf from '../../components/BookShelf';

const MemberHome: React.FC = () => {

    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchCatalog = async () => {
        setLoading(true);
        setError(false);
        try {
            const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
            setBooks(results);
        } catch (error) {
            console.error('Failed to load catalog', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCatalog();
    }, []);

    // slider categories
    const currentlyReading = books.slice(0, 2);
    const trending = books.slice(2, 6);
    const topRated = books.filter((_, i) => i % 2 === 0);
    const latestArrivals = books.filter((_, i) => i % 2 !== 0);

    return (
        <div className="flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-8 sm:py-8">
            {loading && <p className="text-sm text-muted" role="status">Loading books…</p>}
            {error && (
                <div className="flex flex-col items-start gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load books. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void fetchCatalog()}>
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
                    <BookShelf title="Currently reading" books={currentlyReading} />
                    <BookShelf title="Trending" books={trending} />
                    <BookShelf title="Top rated books" books={topRated} />
                    <BookShelf title="Latest arrivals" books={latestArrivals} />
                </>
            )}
        </div>
    );
};

export default MemberHome;