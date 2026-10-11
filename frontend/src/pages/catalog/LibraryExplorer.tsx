import React, { useState, useEffect, useMemo } from 'react';
import { catalogService } from '../../services/catalogService';
import BookCard from '../../components/BookCard';
import type { Book } from '../../types';

type SortOption = 'alphabetical' | 'trending' | 'most-read' | 'least-read' | 'random';

const LibraryExplorer: React.FC = () => {
    const [name, setName] = useState('');
    const [genre, setGenre] = useState('');
    const [freeText, setFreeText] = useState('');
    const [books, setBooks] = useState<Book[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
    const [randomSeed, setRandomSeed] = useState(Math.random());

    const handleSearch = async (isInitial = false) => {
        setLoading(true);
        setErrorMessage('');
        try {
            const results = await catalogService.searchBooks(name, genre, freeText);
            setBooks(results || []);
            if (!isInitial) setHasSearched(true);
        } catch (error) {
            console.error('Failed to search the catalog', error);
            setErrorMessage('Unable to search the catalog. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void handleSearch(true);
    }, []);

    const sortedBooks = useMemo(() => {
        const sorted = [...books];
        switch (sortBy) {
            case 'alphabetical':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'trending':
                return sorted.sort((a, b) => b.ordersNum - a.ordersNum);
            case 'most-read':
                return sorted.sort((a, b) => b.borrowedCopiesNum - a.borrowedCopiesNum);
            case 'least-read':
                return sorted.sort((a, b) => a.borrowedCopiesNum - b.borrowedCopiesNum);
            case 'random':
                // Simple seeded-ish random sort
                return sorted.sort(() => (Math.random() > 0.5 ? 1 : -1));
            default:
                return sorted;
        }
    }, [books, sortBy, randomSeed]);

    const handleSortChange = (option: SortOption) => {
        if (option === 'random') {
            setRandomSeed(Math.random());
        }
        setSortBy(option);
    };

    return (
        <div className="flex min-h-screen flex-col items-center gap-8 p-4 font-sans sm:p-6 lg:p-8">
            <div className="flex w-full max-w-6xl flex-col gap-6">
                <form
                    className="grid w-full grid-cols-1 gap-4 rounded-xl bg-surface p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
                    onSubmit={event => {
                        event.preventDefault();
                        void handleSearch();
                    }}
                >
                    <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
                        Book title
                        <input 
                            className="min-w-0 rounded-md border border-border bg-input px-3.5 py-2.5 text-base font-normal text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" 
                            placeholder="e.g. The Hobbit" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
                        Genre
                        <input 
                            className="min-w-0 rounded-md border border-border bg-input px-3.5 py-2.5 text-base font-normal text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" 
                            placeholder="e.g. Fantasy" 
                            value={genre} 
                            onChange={e => setGenre(e.target.value)} 
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
                        Keywords
                        <input 
                            className="min-w-0 rounded-md border border-border bg-input px-3.5 py-2.5 text-base font-normal text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" 
                            placeholder="e.g. dragons, adventure" 
                            value={freeText} 
                            onChange={e => setFreeText(e.target.value)} 
                        />
                    </label>
                    <button
                        type="submit"
                        className="self-end rounded-md bg-accent-solid px-6 py-2.5 text-base font-semibold text-inverse shadow-sm transition-all can-hover:bg-accent-solid-hover enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Searching…' : 'Search'}
                    </button>
                </form>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-primary">
                        {hasSearched ? 'Search Results' : 'Explore Catalog'}
                        <span className="ml-2 text-sm font-normal text-muted">({books.length} books)</span>
                    </h2>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-secondary">Sort by</span>
                        <select 
                            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary outline-none transition-all focus:border-accent-border focus:ring-2 focus:ring-accent-wash"
                            value={sortBy}
                            onChange={(e) => handleSortChange(e.target.value as SortOption)}
                        >
                            <option value="alphabetical">Alphabetical</option>
                            <option value="trending">Trending</option>
                            <option value="most-read">Most Read</option>
                            <option value="least-read">Least Read</option>
                            <option value="random">Random</option>
                        </select>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className="w-full max-w-6xl rounded-lg border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text shadow-sm" role="alert">
                    <p className="font-semibold">Search Error</p>
                    <p className="text-sm opacity-90">{errorMessage}</p>
                </div>
            )}

            {loading && !books.length && (
                <div className="flex flex-col items-center gap-3 py-20" role="status">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-subtle border-t-accent-solid"></div>
                    <p className="text-sm font-medium text-muted">Loading books...</p>
                </div>
            )}

            {!loading && sortedBooks.length === 0 && (
                <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-2 rounded-2xl bg-surface py-20 text-center shadow-sm">
                    <p className="text-lg font-semibold text-primary">No books found</p>
                    <p className="text-sm text-muted">Try adjusting your search filters to find what you're looking for.</p>
                </div>
            )}

            {sortedBooks.length > 0 && (
                <div className="grid w-full max-w-6xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {sortedBooks.map((book, index) => (
                        <div 
                            key={book.bookId}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                            style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                        >
                            <BookCard book={book} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LibraryExplorer;