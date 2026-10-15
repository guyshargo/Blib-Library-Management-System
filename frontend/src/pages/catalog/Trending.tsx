import React, { useEffect, useState } from 'react';
import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';
import type { BookGenre } from '../../types/enums';
import HorizontalBookCard from '../../components/common/HorizontalBookCard';
import { Tag } from '../../components/ui/Tag';

const formatGenreLabel = (genre: string): string => {
    if (genre === 'SCI_FI') return 'Sci-Fi';
    return genre
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const Trending: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedTab, setSelectedTab] = useState<string>('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchCatalog = async () => {
        setLoading(true);
        setError(false);
        try {
            const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
            setBooks(results || []);
        } catch (err) {
            console.error('Failed to load catalog for trending', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCatalog();
    }, []);

    const sortByTrending = (list: Book[]) =>
        [...list].sort(
            (a, b) =>
                b.ordersNum * 2 + b.borrowedNum + b.rating -
                (a.ordersNum * 2 + a.borrowedNum + a.rating)
        );

    const activeGenres = Array.from(new Set(books.map(b => b.genre))).filter(Boolean) as BookGenre[];

    const displayedBooks =
        selectedTab === 'ALL'
            ? sortByTrending(books).slice(0, 20)
            : sortByTrending(books.filter(b => b.genre === selectedTab));

    const activeTitle =
        selectedTab === 'ALL' ? 'Now' : formatGenreLabel(selectedTab);

    return (
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-primary">
                    Trending Books: {activeTitle}
                </h1>
                <p className="mt-1 text-sm text-muted">
                    See what readers from the community are adding to their bookshelves
                </p>
            </div>

            {/* Filter Bar Using Tag Component */}
            {!loading && !error && books.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
                    <Tag
                        label="Now"
                        variant={selectedTab === 'ALL' ? 'accent' : 'character'}
                        onClick={() => setSelectedTab('ALL')}
                    />
                    {activeGenres.map(genre => (
                        <Tag
                            key={genre}
                            label={formatGenreLabel(genre)}
                            variant={selectedTab === genre ? 'accent' : 'character'}
                            onClick={() => setSelectedTab(genre)}
                        />
                    ))}
                </div>
            )}

            {loading && (
                <p className="text-sm text-muted" role="status">
                    Loading trending books…
                </p>
            )}

            {error && (
                <div
                    className="flex flex-col items-start gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text"
                    role="alert"
                >
                    <p>Unable to load trending books. Check your connection and try again.</p>
                    <button
                        className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold"
                        onClick={() => void fetchCatalog()}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Vertical List of Horizontal Book Cards */}
            {!loading && !error && displayedBooks.length > 0 && (
                <div className="flex flex-col gap-4">
                    {displayedBooks.map(book => (
                        <HorizontalBookCard key={book.bookId} book={book} />
                    ))}
                </div>
            )}

            {!loading && !error && displayedBooks.length === 0 && (
                <div className="rounded-lg border border-border-subtle bg-surface p-6 text-primary">
                    <h2 className="text-lg font-semibold">No trending books available</h2>
                    <p className="mt-2 text-sm text-muted">
                        Check back later as library activity grows.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Trending;