import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';
import type { BookGenre } from '../../types/enums';
import BookShelf from '../../components/BookShelf';
import { Tag } from '../../components/Tag';

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

    const scrollToGenre = (genre: string) => {
        const el = document.getElementById(`trending-${genre}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Overall trending sorted by ordersNum / borrowedNum / rating
    const overallTrending = [...books]
        .sort((a, b) => (b.ordersNum * 2 + b.borrowedNum + b.rating) - (a.ordersNum * 2 + a.borrowedNum + a.rating))
        .slice(0, 15);

    // Genres with books
    const genresWithBooks = Array.from(new Set(books.map(b => b.genre))).filter(Boolean) as BookGenre[];

    // Trending books grouped and sorted per genre
    const trendingByGenre = genresWithBooks.reduce<Record<string, Book[]>>((acc, genre) => {
        const genreBooks = books.filter(b => b.genre === genre);
        const sortedGenreBooks = genreBooks.sort((a, b) => (b.ordersNum * 2 + b.borrowedNum + b.rating) - (a.ordersNum * 2 + a.borrowedNum + a.rating));
        if (sortedGenreBooks.length > 0) {
            acc[genre] = sortedGenreBooks;
        }
        return acc;
    }, {});

    const activeGenres = Object.keys(trendingByGenre) as BookGenre[];

    return (
        <div className="flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-8 sm:py-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary">Trending Now</h1>
                <p className="mt-1 text-sm text-muted">Discover the most popular and frequently borrowed books across the library and in every genre.</p>
            </div>

            {loading && <p className="text-sm text-muted" role="status">Loading trending books…</p>}
            {error && (
                <div className="flex flex-col items-start gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load trending books. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void fetchCatalog()}>
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && books.length > 0 && (
                <>
                    {/* Quick-Jump Chips Bar using Tag component */}
                    <div className="flex flex-wrap gap-2">
                        <Tag
                            label="Top Trending Overall"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        />
                        {activeGenres.map(genre => (
                            <Tag
                                key={genre}
                                label={formatGenreLabel(genre)}
                                onClick={() => scrollToGenre(genre)}
                            />
                        ))}
                    </div>

                    {/* Overall Trending Shelf */}
                    {overallTrending.length > 0 && (
                        <section>
                            <div className="mb-2.5 flex items-center justify-between">
                                <h2 className="text-[22px] font-extrabold text-accent-text">
                                    Most Popular in Library
                                </h2>
                                <Link
                                    to="/catalog?sort=trending"
                                    className="text-sm font-semibold text-accent-text hover:underline"
                                >
                                    Explore all &rarr;
                                </Link>
                            </div>
                            <BookShelf title="" books={overallTrending} />
                        </section>
                    )}

                    {/* Trending by Genre Shelves */}
                    <div className="flex flex-col gap-8">
                        {activeGenres.map(genre => {
                            const genreBooks = trendingByGenre[genre] || [];
                            if (genreBooks.length === 0) return null;
                            return (
                                <section key={genre} id={`trending-${genre}`} className="scroll-mt-6">
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <h2 className="text-[22px] font-extrabold text-accent-text">
                                            Trending in {formatGenreLabel(genre)}
                                        </h2>
                                        <Link
                                            to={`/catalog?genre=${encodeURIComponent(genre)}&sort=trending`}
                                            className="text-sm font-semibold text-accent-text hover:underline"
                                        >
                                            Explore all {formatGenreLabel(genre)} &rarr;
                                        </Link>
                                    </div>
                                    <BookShelf title="" books={genreBooks} />
                                </section>
                            );
                        })}
                    </div>
                </>
            )}

            {!loading && !error && books.length === 0 && (
                <div className="bg-surface p-6 text-primary">
                    <h2 className="text-lg font-semibold">No trending books available</h2>
                    <p className="mt-2 text-sm text-muted">Check back later as library activity grows.</p>
                </div>
            )}
        </div>
    );
};

export default Trending;
