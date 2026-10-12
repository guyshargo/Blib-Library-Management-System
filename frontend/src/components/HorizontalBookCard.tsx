import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';

interface HorizontalBookCardProps {
    book: Book;
    highlightTerm?: string;
    onAuthorClick?: (author: string) => void;
}

const formatGenreLabel = (genre: string): string => {
    if (!genre) return '';
    if (genre === 'SCI_FI') return 'Sci-Fi';
    return genre
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const HorizontalBookCard: React.FC<HorizontalBookCardProps> = ({
    book,
    onAuthorClick,
}) => {
    const navigate = useNavigate();

    const handlePreview = () => {
        navigate('/book-details', { state: { selectedBook: book } });
    };

    const handleAuthorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAuthorClick) {
            onAuthorClick(book.author);
        } else {
            navigate('/search', { state: { initialSearch: book.author } });
        }
    };

    const keywordsList = book.keywords
        ? book.keywords
              .split(',')
              .map(k => k.trim())
              .filter(Boolean)
              .slice(0, 3)
        : [];

    const ratingValue = Number(book.rating || 0);
    const fullStars = Math.round(ratingValue);

    return (
        <article className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-soft/50 p-4 transition-colors can-hover:bg-surface-soft sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            {/* Left + Middle: Cover & Book Info */}
            <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
                <button
                    type="button"
                    onClick={handlePreview}
                    className="shrink-0 overflow-hidden rounded shadow-[0_4px_12px_rgba(var(--color-shadow),0.18)] transition-transform can-hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border"
                >
                    <img
                        src={`/images/covers/${book.bookId}.jpg`}
                        alt={book.title}
                        onError={e => {
                            e.currentTarget.src = '/images/book_logo.png';
                        }}
                        className="h-36 w-24 object-cover bg-surface sm:h-40 sm:w-28"
                    />
                </button>

                <div className="flex min-w-0 flex-1 flex-col pt-1">
                    <button
                        type="button"
                        onClick={handlePreview}
                        className="text-start text-lg font-extrabold leading-snug text-primary can-hover:text-accent-text can-hover:underline sm:text-xl"
                    >
                        {book.title}
                    </button>

                    <div className="mt-1 text-sm text-secondary">
                        by{' '}
                        <button
                            type="button"
                            onClick={handleAuthorClick}
                            className="font-semibold text-accent-text can-hover:underline"
                        >
                            {book.author || 'Unknown Author'}
                        </button>
                    </div>

                    {/* Star Rating Row */}
                    {ratingValue > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary">
                            <span className="tracking-tight text-amber-500" aria-hidden="true">
                                {'★'.repeat(Math.min(5, Math.max(0, fullStars)))}
                                {'☆'.repeat(Math.max(0, 5 - fullStars))}
                            </span>
                            <span className="font-semibold text-primary">
                                {ratingValue.toFixed(2)}
                            </span>
                            {book.borrowedNum > 0 && (
                                <span className="text-muted">
                                    · {book.borrowedNum} currently borrowed
                                </span>
                            )}
                        </div>
                    )}

                    {/* Genre & Keyword Pills */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {book.genre && (
                            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-primary">
                                {formatGenreLabel(book.genre)}
                            </span>
                        )}
                        {keywordsList.map(kw => (
                            <span
                                key={kw}
                                className="rounded-full border border-border-subtle bg-surface px-2.5 py-0.5 text-xs text-muted"
                            >
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Single Preview Book Button */}
            <div className="flex shrink-0 items-center sm:self-center">
                <button
                    type="button"
                    onClick={handlePreview}
                    className="w-full rounded-md bg-accent-solid px-6 py-2.5 text-center text-sm font-bold text-inverse shadow-sm transition-opacity can-hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border sm:w-44"
                >
                    Preview Book
                </button>
            </div>
        </article>
    );
};

export default HorizontalBookCard;