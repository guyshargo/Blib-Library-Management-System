import type { BrowseIconName } from '../components/ui/BrowseIcon';

export interface BrowseLink {
    path: string;
    label: string;
    description: string;
    icon: BrowseIconName;
}

export const librarianLinks: BrowseLink[] = [
    { path: '/manage-members', label: 'Manage Members', description: 'Search and view member profiles', icon: 'memberList' },
    { path: '/borrow-book', label: 'Borrow Book', description: 'Issue a book copy to a member', icon: 'borrow' },
    { path: '/return-book', label: 'Return Book', description: 'Process returned book copies', icon: 'return' },
    { path: '/reports', label: 'Reports', description: 'View monthly analytics and charts', icon: 'reports' },
    { path: '/invoices', label: 'Invoices', description: 'Review system messages and logs', icon: 'invoice' }
];

export const memberLinks: BrowseLink[] = [
    { path: '/genres', label: 'Genres', description: 'Browse different genres', icon: 'genres' },
    { path: '/trending', label: 'Trending', description: 'Most popular right now', icon: 'trending' },
    { path: '/catalog', label: 'Library Explorer', description: 'Browse the virtual shelves', icon: 'catalog' }
];