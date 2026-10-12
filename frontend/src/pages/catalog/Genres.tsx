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

const Genres: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchCatalog = async () => {
        setLoading(true);
        setError(false);
        try {
            const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
            setBooks(results);
        } catch (err) {
            console.error('Failed to load catalog for genres', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCatalog();
    }, []);

    const scrollToGenre = (genre: string) => {
        const el = document.getElementById(`genre-${genre}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Extract unique genres present in books, or use a sorted list of genres that have books
    const genresWithBooks = Array.from(new Set(books.map(b => b.genre))).filter(Boolean) as BookGenre[];
    
    // Group books by genre
    const booksByGenre = books.reduce<Record<string, Book[]>>((acc, book) => {
        if (!book.genre) return acc;
        if (!acc[book.genre]) {
            acc[book.genre] = [];
        }
        acc[book.genre].push(book);
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-8 sm:py-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary">Browse by Genre</h1>
                <p className="mt-1 text-sm text-muted">Explore curated collections across fiction, non-fiction, science, and more.</p>
            </div>

            {loading && <p className="text-sm text-muted" role="status">Loading genres…</p>}
            {error && (
                <div className="flex flex-col items-start gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load books. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void fetchCatalog()}>
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && genresWithBooks.length > 0 && (
                <>
                    {/* Quick-Jump Chips Bar using Tag component */}
                    <div className="flex flex-wrap gap-2">
                        {genresWithBooks.map(genre => (
                            <Tag
                                key={genre}
                                label={`${formatGenreLabel(genre)} (${booksByGenre[genre]?.length || 0})`}
                                onClick={() => scrollToGenre(genre)}
                            />
                        ))}
                    </div>

                    {/* Vertical stack of horizontal shelves */}
                    <div className="flex flex-col gap-8">
                        {genresWithBooks.map(genre => {
                            const genreBooks = booksByGenre[genre] || [];
                            if (genreBooks.length === 0) return null;
                            return (
                                <section key={genre} id={`genre-${genre}`} className="scroll-mt-6">
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <h2 className="text-[22px] font-extrabold text-accent-text">
                                            {formatGenreLabel(genre)}
                                        </h2>
                                        <Link
                                            to={`/catalog?genre=${encodeURIComponent(genre)}`}
                                            className="text-sm font-semibold text-accent-text hover:underline"
                                        >
                                            Explore all &rarr;
                                        </Link>
                                    </div>
                                    <BookShelf title="" books={genreBooks} />
                                </section>
                            );
                        })}
                    </div>
                </>
            )}

            {!loading && !error && genresWithBooks.length === 0 && (
                <div className="bg-surface p-6 text-primary">
                    <h2 className="text-lg font-semibold">No genres available</h2>
                    <p className="mt-2 text-sm text-muted">Check back later when books are added.</p>
                </div>
            )}
        </div>
    );
};

export default Genres;
