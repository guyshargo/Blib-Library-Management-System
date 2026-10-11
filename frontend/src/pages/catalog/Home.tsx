import React, { useEffect, useState } from 'react';

import { catalogService } from '../../services/catalogService';
import type { Book } from '../../types';
import BookShelf from '../../components/BookShelf';

const MemberHome: React.FC = () => {

    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const results = await catalogService.searchBooks('is empty', 'is empty', 'is empty');
                setBooks(results);
            } catch (error) {
                console.error("Failed to fetch catalog", error);
            }
        };
        fetchCatalog();
    }, []);

    // slider categories
    const currentlyReading = books.slice(0, 2); 
    const topRated = books.filter((_, i) => i % 2 === 0);
    const latestArrivals = books.filter((_, i) => i % 2 !== 0);

    return (
        <div className="flex flex-col gap-[45px] px-[50px] py-[30px]">
            <BookShelf title="Currently reading" books={currentlyReading} />
            <BookShelf title="Top rated books" books={topRated} />
            <BookShelf title="Latest arrivals" books={latestArrivals} />
        </div>
    );
};

export default MemberHome;