import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';
import { RECENT_SEARCHES_KEY } from '../../constants/appConstants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(RECENT_SEARCHES_KEY, []);

    // Load catalog once so live typing filters instantaneously by title & author
    useEffect(() => {
        if (!isOpen || allBooks.length > 0) return;

        const fetchBooks = async () => {
            setIsLoading(true);
            try {
                const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
                setAllBooks(results || []);
            } catch (error) {
                console.error('Failed to load books for live search', error);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchBooks();
    }, [isOpen, allBooks.length]);

    // Auto-focus input and handle Escape / background scroll lock
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            return;
        }

        const timer = setTimeout(() => inputRef.current?.focus(), 10);
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const trimmedQuery = query.trim().toLowerCase();

    // Matching unique authors
    const matchingAuthors = useMemo(() => {
        if (!trimmedQuery) return [];
        const uniqueAuthors = Array.from(
            new Set(allBooks.map(b => b.author).filter(Boolean))
        );
        return uniqueAuthors
            .filter(author => author.toLowerCase().includes(trimmedQuery))
            .slice(0, 4);
    }, [allBooks, trimmedQuery]);

    // Matching books
    const matchingBooks = useMemo(() => {
        if (!trimmedQuery) return [];
        return allBooks
            .filter(
                book =>
                    book.title?.toLowerCase().includes(trimmedQuery) ||
                    book.author?.toLowerCase().includes(trimmedQuery)
            )
            .slice(0, 6);
    }, [allBooks, trimmedQuery]);

    if (!isOpen) return null;

    const saveRecentSearch = (term: string) => {
        const clean = term.trim();
        if (!clean) return;
        const updated = [
            clean,
            ...recentSearches.filter(item => item.toLowerCase() !== clean.toLowerCase()),
        ].slice(0, 6);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    const handleSelectAuthor = (author: string) => {
        saveRecentSearch(author);
        onClose();
        navigate('/search', { state: { initialSearch: author } });
    };

    const handleSelectBook = (book: Book) => {
        saveRecentSearch(book.title);
        onClose();
        navigate('/book-details', { state: { selectedBook: book } });
    };

    const handleSeeResults = () => {
        if (query.trim()) {
            saveRecentSearch(query);
        }
        onClose();
        navigate('/search', { state: { initialSearch: query.trim() } });
    };

    const hasMatches = matchingAuthors.length > 0 || matchingBooks.length > 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-16 backdrop-blur-sm transition-opacity"
            onMouseDown={e => {
                if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                    onClose();
                }
            }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search books and authors"
                className="w-full max-w-2xl overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_16px_40px_rgba(var(--color-shadow),0.24)]"
            >
                {/* Top Search Input Row */}
                <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5">
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

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSeeResults();
                        }}
                        placeholder="Search books and authors..."
                        className="w-full bg-transparent text-base text-primary placeholder:text-muted outline-none sm:text-sm"
                    />

                    {query && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => {
                                setQuery('');
                                inputRef.current?.focus();
                            }}
                            className="rounded p-1 text-muted transition-colors can-hover:bg-surface-soft can-hover:text-primary"
                        >
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded border border-border bg-surface-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary can-hover:bg-accent-wash can-hover:text-primary"
                    >
                        ESC
                    </button>
                </div>

                {/* Results / Recent Searches Body */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border-subtle">
                    {!trimmedQuery ? (
                        recentSearches.length > 0 ? (
                            <div>
                                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                                    Recent Searches
                                </div>
                                <ul className="divide-y divide-border-subtle">
                                    {recentSearches.map(term => (
                                        <li key={term} className="flex items-center justify-between px-4 py-2.5 transition-colors can-hover:bg-surface-soft">
                                            <button
                                                type="button"
                                                onClick={() => setQuery(term)}
                                                className="flex min-w-0 flex-1 items-center gap-3 text-start text-sm text-primary"
                                            >
                                                <svg
                                                    aria-hidden="true"
                                                    viewBox="0 0 24 24"
                                                    className="h-4 w-4 shrink-0 text-muted"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <circle cx="12" cy="12" r="9" />
                                                    <path d="M12 7v5l3 2" />
                                                </svg>
                                                <span className="truncate font-medium">{term}</span>
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Remove "${term}" from recent searches`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const updated = recentSearches.filter(item => item !== term);
                                                    setRecentSearches(updated);
                                                    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
                                                }}
                                                className="ml-2 rounded p-1 text-muted transition-colors can-hover:bg-surface-soft can-hover:text-primary"
                                            >
                                                <svg
                                                    aria-hidden="true"
                                                    viewBox="0 0 24 24"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M18 6 6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-muted">
                                Start typing to search by book title or author...
                            </div>
                        )
                    ) : isLoading ? (
                        <div className="px-4 py-8 text-center text-sm text-muted">
                            Searching catalog...
                        </div>
                    ) : hasMatches ? (
                        <>
                            {/* AUTHORS SECTION */}
                            {matchingAuthors.length > 0 && (
                                <div>
                                    <div className="bg-surface-soft/30 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                                        Authors
                                    </div>
                                    <ul className="divide-y divide-border-subtle">
                                        {matchingAuthors.map(author => (
                                            <li key={author}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectAuthor(author)}
                                                    className="flex w-full items-center gap-3.5 px-4 py-2.5 text-start transition-colors can-hover:bg-surface-soft"
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-secondary">
                                                        <svg
                                                            aria-hidden="true"
                                                            viewBox="0 0 24 24"
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <circle cx="12" cy="8" r="4" />
                                                            <path d="M5 20a7 7 0 0 1 14 0" />
                                                        </svg>
                                                    </span>
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <span className="truncate text-sm font-bold text-primary">
                                                            {author}
                                                        </span>
                                                        <span className="text-xs text-muted">
                                                            Author
                                                        </span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* BOOKS SECTION */}
                            {matchingBooks.length > 0 && (
                                <div>
                                    <div className="bg-surface-soft/30 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                                        Books
                                    </div>
                                    <ul className="divide-y divide-border-subtle">
                                        {matchingBooks.map(book => (
                                            <li key={book.bookId}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectBook(book)}
                                                    className="flex w-full items-center gap-3.5 px-4 py-2.5 text-start transition-colors can-hover:bg-surface-soft"
                                                >
                                                    <img
                                                        src={`/images/covers/${book.bookId}.jpg`}
                                                        alt={book.title}
                                                        className="h-12 w-9 shrink-0 rounded bg-surface-soft object-cover shadow-sm"
                                                        onError={e => {
                                                            e.currentTarget.src = '/images/book_logo.png';
                                                        }}
                                                    />
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <span className="truncate text-sm font-bold text-primary">
                                                            {book.title}
                                                        </span>
                                                        <span className="truncate text-xs text-secondary">
                                                            {book.author}
                                                        </span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="px-4 py-8 text-center text-sm text-muted">
                            No authors or books found matching "{query}"
                        </div>
                    )}
                </div>

                {/* Bottom Footer */}
                <div className="flex items-center justify-end border-t border-border-subtle bg-surface-soft/50 px-4 py-2.5">
                    <button
                        type="button"
                        onClick={handleSeeResults}
                        className="rounded-md bg-accent-solid px-4 py-1.5 text-xs font-bold text-inverse transition-opacity can-hover:opacity-90"
                    >
                        See results
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;