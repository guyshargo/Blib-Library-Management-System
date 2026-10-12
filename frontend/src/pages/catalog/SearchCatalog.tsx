import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';
import HorizontalBookCard from '../../components/HorizontalBookCard';

const getInitials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');

const SearchCatalog: React.FC = () => {
    const location = useLocation();
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [query, setQuery] = useState<string>(() => location.state?.initialSearch || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Sync query whenever SearchModal navigates to /catalog with a new initialSearch
    useEffect(() => {
        if (location.state?.initialSearch !== undefined) {
            setQuery(location.state.initialSearch);
        }
    }, [location.state]);

    const fetchAllBooks = async () => {
        setLoading(true);
        setError(false);
        try {
            const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
            setAllBooks(results || []);
        } catch (err) {
            console.error('Failed to load catalog', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAllBooks();
    }, []);

    const trimmedQuery = query.trim().toLowerCase();

    // Matching unique authors when a search term is present
    const matchingAuthors = useMemo(() => {
        if (!trimmedQuery) return [];
        const uniqueAuthors = Array.from(
            new Set(allBooks.map(b => b.author).filter(Boolean))
        );
        return uniqueAuthors
            .filter(author => author.toLowerCase().includes(trimmedQuery))
            .slice(0, 6);
    }, [allBooks, trimmedQuery]);

    // Matching books by title, author, genre, or keywords
    const matchingBooks = useMemo(() => {
        if (!trimmedQuery) return allBooks;
        return allBooks.filter(
            book =>
                book.title?.toLowerCase().includes(trimmedQuery) ||
                book.author?.toLowerCase().includes(trimmedQuery) ||
                book.genre?.toLowerCase().includes(trimmedQuery) ||
                book.keywords?.toLowerCase().includes(trimmedQuery)
        );
    }, [allBooks, trimmedQuery]);

    return (
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
            <h1 className="text-3xl font-extrabold text-primary">Search Books</h1>

            {/* Search Input Box */}
            <div className="flex max-w-2xl items-center justify-between rounded-lg border-2 border-border bg-surface px-4 py-2.5 focus-within:border-accent-border">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search books, authors, or subjects..."
                    className="w-full bg-transparent text-base text-primary placeholder:text-muted outline-none"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="mr-2 text-xs font-semibold text-muted can-hover:text-primary"
                    >
                        Clear
                    </button>
                )}
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
            </div>

            {loading && (
                <p className="text-sm text-muted" role="status">
                    Loading catalog results…
                </p>
            )}

            {error && (
                <div
                    className="flex flex-col items-start gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text"
                    role="alert"
                >
                    <p>Unable to load catalog results. Check your connection and try again.</p>
                    <button
                        className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold"
                        onClick={() => void fetchAllBooks()}
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* AUTHORS Section */}
                    {matchingAuthors.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                                Authors
                            </h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {matchingAuthors.map(author => (
                                    <button
                                        key={author}
                                        type="button"
                                        onClick={() => setQuery(author)}
                                        className="flex items-center gap-3.5 rounded-lg border border-border-subtle bg-surface-soft/60 p-3 text-start transition-colors can-hover:border-accent-border can-hover:bg-surface-soft"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-sm font-extrabold text-accent-text">
                                            {getInitials(author)}
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-bold text-accent-text">
                                                {author}
                                            </span>
                                            <span className="text-xs text-muted">Author</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* BOOKS Section */}
                    <section className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                                Books
                            </h2>
                            <span className="text-xs text-muted">
                                {matchingBooks.length > 0
                                    ? `1 - ${matchingBooks.length} of ${matchingBooks.length} results`
                                    : '0 results'}
                            </span>
                        </div>

                        {matchingBooks.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {matchingBooks.map(book => (
                                    <HorizontalBookCard
                                        key={book.bookId}
                                        book={book}
                                        onAuthorClick={authorName => setQuery(authorName)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border-subtle bg-surface-soft/40 p-8 text-center text-sm text-muted">
                                No books or authors match "{query}".
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default SearchCatalog;