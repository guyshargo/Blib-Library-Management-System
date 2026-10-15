import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../../types';
import { Tag } from '../ui/Tag';

interface BookCardProps {
    book: Book;
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

const BookCard: React.FC<BookCardProps> = ({ book }) => {
    const navigate = useNavigate();

    // Safely fallback to the default logo if a specific ID cover hasn't been downloaded yet
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = '/images/book_logo.png';
    };

    return (
        <div 
            onClick={() => navigate(`/book-details?id=${book.bookId}`, { state: { selectedBook: book } })}
            className="flex min-w-[120px] max-w-[120px] shrink-0 cursor-pointer flex-col items-center bg-transparent"
        >
            <img 
                src={`/images/covers/${book.bookId}.jpg`} 
                alt={book.title}
                onError={handleImageError}
                className="book-cover-image relative h-[180px] w-[120px] rounded-[2px] object-cover shadow-[3px_5px_10px_rgba(0,0,0,0.35)]"
            />

            {/* Book Title */}
            <div
                title={book.title}
                className="mt-2 w-full truncate px-1 text-center font-sans text-sm font-extrabold text-primary"
            >
                {book.title}
            </div>

            {/* Author Byline */}
            <div
                title={book.author}
                className="mt-0.5 mb-1.5 w-full truncate px-1 text-center font-sans text-xs font-medium text-secondary"
            >
                {book.author || 'Unknown Author'}
            </div>

            {/* Reusable Genre Tag */}
            {book.genre && (
                <Tag
                    label={formatGenreLabel(book.genre)}
                    variant="accent"
                />
            )}
        </div>
    );
};

export default BookCard;