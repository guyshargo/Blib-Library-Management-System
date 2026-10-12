import React from 'react';
import { useNavigate } from 'react-router-dom';

const LibrarianDashboard: React.FC = () => {
    const navigate = useNavigate();

    const btnClass = "min-h-16 w-full rounded-md bg-accent-solid px-4 py-4 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover sm:text-lg";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <div className="relative z-10 mb-4 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
                <button className={btnClass} onClick={() => navigate('/catalog')}>Search Book</button>
                <button className={btnClass} onClick={() => navigate('/manage-members')}>Manage Member</button>
                <button className={btnClass} onClick={() => navigate('/register-member')}>Register Member</button>

                <button className={btnClass} onClick={() => navigate('/borrow-book')}>Borrow Page</button>
                <button className={btnClass} onClick={() => navigate('/return-book')}>Return Book Page</button>
                <button className={btnClass} onClick={() => navigate('/reports')}>Report Page</button>
            </div>

            <div className="opacity-50">
                <img src="/images/computerbook.png" alt="Library graphic" className="w-full max-w-[450px]" />
            </div>
        </div>
    );
};

export default LibrarianDashboard;