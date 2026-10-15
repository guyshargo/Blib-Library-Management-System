import React from 'react';

export type BrowseIconName = 
    | 'memberList' | 'addMember' | 'borrow' | 'return' 
    | 'reports' | 'invoice' | 'catalog' | 'genres' | 'trending';

interface BrowseIconProps {
    name: BrowseIconName;
    className?: string;
}

const BrowseIcon: React.FC<BrowseIconProps> = ({ name, className = "h-5 w-5" }) => {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {name === 'memberList' && <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M17 11a3 3 0 1 0 0-6m3 15v-1.5a3.5 3.5 0 0 0-2.5-3.35" /></>}
            {name === 'addMember' && <><circle cx="9" cy="8" r="3.5" /><path d="M3 20v-1.5A3.5 3.5 0 0 1 6.5 15h5a3.5 3.5 0 0 1 3.5 3.5V20M19 8v6m-3-3h6" /></>}
            {name === 'borrow' && <><path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M8 20a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3m4 4h4m-4 4h4" /><path d="m16 14 2 2 3-3" /></>}
            {name === 'return' && <><path d="M9 7 4 12l5 5" /><path d="M4 12h10a5 5 0 0 1 5 5v2" /></>}
            {name === 'reports' && <><path d="M4 20V11m5 9V5m5 15v-7m5 7V8" /></>}
            {name === 'invoice' && <><path d="M6 3.5h9l4 4V20H6z" /><path d="M14.5 3.5V8H19M9 12h7m-7 4h7" /></>}
            {name === 'catalog' && <><circle cx="12" cy="12" r="8.5" /><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1z" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2" /></>}
            {name === 'genres' && <><path d="m6 18 7.5-7.5" /><path d="m12.5 4 .8 2.2L15.5 7l-2.2.8-.8 2.2-.8-2.2L9.5 7l2.2-.8z" /><path d="m18 12 .6 1.4L20 14l-1.4.6L18 16l-.6-1.4L16 14l1.4-.6z" /><path d="m5 5 .5 1.5L7 7l-1.5.5L5 9l-.5-1.5L3 7l1.5-.5z" /></>}
            {name === 'trending' && <><path d="M4 18 10 12l4 3 6-8" /><path d="M14 7h6v6" /></>}
        </svg>
    );
};

export default BrowseIcon;