import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import type { Book } from '../../types';
import BookCard from './BookCard';

interface BookShelfProps {
    title: string;
    books: Book[];
}

const BookShelf: FC<BookShelfProps> = ({ title, books }) => {
    const shelfRef = useRef<HTMLDivElement>(null);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [canScrollToStart, setCanScrollToStart] = useState(false);
    const [canScrollToEnd, setCanScrollToEnd] = useState(false);
    const [isRtl, setIsRtl] = useState(false);

    const updateScrollState = useCallback(() => {
        const shelf = shelfRef.current;
        const firstBook = shelf?.firstElementChild;
        const lastBook = shelf?.lastElementChild;
        if (!shelf || !firstBook || !lastBook) {
            setHasOverflow(false);
            setCanScrollToStart(false);
            setCanScrollToEnd(false);
            return;
        }

        const direction = getComputedStyle(shelf).direction;
        const isRtlDirection = direction === 'rtl';
        setIsRtl(isRtlDirection);
        const shelfBounds = shelf.getBoundingClientRect();
        const styles = getComputedStyle(shelf);
        const startInset = Number.parseFloat(isRtlDirection ? styles.paddingRight : styles.paddingLeft);
        const endInset = Number.parseFloat(isRtlDirection ? styles.paddingLeft : styles.paddingRight);
        const startEdge = isRtlDirection ? shelfBounds.right - startInset : shelfBounds.left + startInset;
        const endEdge = isRtlDirection ? shelfBounds.left + endInset : shelfBounds.right - endInset;
        const firstBounds = firstBook.getBoundingClientRect();
        const lastBounds = lastBook.getBoundingClientRect();
        const overflow = shelf.scrollWidth > shelf.clientWidth + 1;

        setHasOverflow(overflow);
        setCanScrollToStart(overflow && (isRtlDirection
            ? firstBounds.right > startEdge + 1
            : firstBounds.left < startEdge - 1));
        setCanScrollToEnd(overflow && (isRtlDirection
            ? lastBounds.left < endEdge - 1
            : lastBounds.right > endEdge + 1));
    }, []);

    useEffect(() => {
        const shelf = shelfRef.current;
        if (!shelf) return;

        updateScrollState();
        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(shelf);
        Array.from(shelf.children).forEach(child => resizeObserver.observe(child));

        shelf.addEventListener('scroll', updateScrollState, { passive: true });
        return () => {
            resizeObserver.disconnect();
            shelf.removeEventListener('scroll', updateScrollState);
        };
    }, [books.length, updateScrollState]);

    const scroll = (towardEnd: boolean) => {
        const shelf = shelfRef.current;
        if (!shelf) return;

        const isRtl = getComputedStyle(shelf).direction === 'rtl';
        const direction = towardEnd !== isRtl ? 1 : -1;
        shelf.scrollBy({
            left: direction * Math.max(240, shelf.clientWidth * 0.8),
            behavior: 'smooth',
        });
    };

    const startArrowRotation = isRtl ? 'rotate-180' : '';

    return (
        <section>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-sans text-[22px] font-extrabold text-accent-text">{title}</h2>
                {hasOverflow && (
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            aria-label={`Scroll ${title} toward the beginning`}
                            className="flex h-9 w-9 items-center justify-center border border-border-subtle bg-surface text-primary transition-colors can-hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={!canScrollToStart}
                            onClick={() => scroll(false)}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 ${startArrowRotation}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            aria-label={`Scroll ${title} toward the end`}
                            className="flex h-9 w-9 items-center justify-center border border-border-subtle bg-surface text-primary transition-colors can-hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={!canScrollToEnd}
                            onClick={() => scroll(true)}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 ${isRtl ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                    </div>
                )}
                </div>
                <div className="min-w-0 rounded-[3px] border-b-[10px] border-border-strong shadow-[0_5px_5px_rgba(0,0,0,0.1)]">
                    <div
                        ref={shelfRef}
                        className="book-shelf-scroll flex min-h-[220px] min-w-0 gap-5 overflow-x-auto pb-2.5 ps-4 pe-4 pt-2 sm:gap-8 sm:ps-5 sm:pe-5"
                        onScroll={updateScrollState}
                    >
                        {books.map(book => <BookCard key={book.bookId} book={book} />)}
                    </div>
                </div>
        </section>
    );
};

export default BookShelf;
