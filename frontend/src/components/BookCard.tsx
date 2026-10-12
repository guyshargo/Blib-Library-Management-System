import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';

interface BookCardProps {
    book: Book;
}

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
                className="book-cover-image relative w-[120px] h-[180px] object-cover rounded-[2px] shadow-[3px_5px_10px_rgba(0,0,0,0.35)]"
            />

            <div className="mt-2 w-full truncate px-1 text-center font-sans text-sm font-extrabold text-primary">
                {book.title}
            </div>

            {/* Using genre since author isn't in your Book interface yet */}
            <div className="w-full truncate px-1 text-center font-sans text-xs text-secondary">
                {book.genre}
            </div>
        </div>
    );
};

export default BookCard;