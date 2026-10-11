import React from 'react';
import { useNavigate } from 'react-router-dom';

const LibrarianDashboard: React.FC = () => {
    const navigate = useNavigate();

    const btnClass = "bg-accent-subtle rounded-full text-primary font-semibold border-2 border-transparent cursor-pointer transition-all duration-200 hover:bg-accent-subtle-hover hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)] h-[75px] text-[23px] px-[25px]";

    return (
        <div className="flex flex-col p-[30px] font-sans min-h-screen gap-5 items-center justify-center">
            <div className="relative z-10 grid grid-cols-3 gap-[30px] mb-10">
                <button className={btnClass} onClick={() => navigate('/catalog')}>Search Book</button>
                <button className={btnClass} onClick={() => navigate('/manage-members')}>Manage Member</button>
                <button className={btnClass} onClick={() => navigate('/register-member')}>Register Member</button>

                <button className={btnClass} onClick={() => navigate('/borrow-book')}>Borrow Page</button>
                <button className={btnClass} onClick={() => navigate('/return-book')}>Return Book Page</button>
                <button className={btnClass} onClick={() => navigate('/reports')}>Report Page</button>
            </div>

            <div className="opacity-50">
                <img src="/images/computerbook.png" alt="Library Graphic" className="max-w-[450px]" />
            </div>
        </div>
    );
};

export default LibrarianDashboard;