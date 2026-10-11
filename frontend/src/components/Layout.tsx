import React, {useEffect, useRef, useState} from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

type ColorTheme = 'wood' | 'botanical' | 'coastal';
type BrowseIconName = 'dashboard' | 'members' | 'addMember' | 'borrow' | 'return' | 'memberList' | 'reports' | 'invoice' | 'catalog' | 'subjects' | 'trending';

const BrowseLinkIcon: React.FC<{ name: BrowseIconName }> = ({ name }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {name === 'dashboard' && <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>}
        {name === 'members' && <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M17 11a3 3 0 1 0 0-6m3 15v-1.5a3.5 3.5 0 0 0-2.5-3.35" /></>}
        {name === 'addMember' && <><circle cx="9" cy="8" r="3.5" /><path d="M3 20v-1.5A3.5 3.5 0 0 1 6.5 15h5a3.5 3.5 0 0 1 3.5 3.5V20M19 8v6m-3-3h6" /></>}
        {name === 'borrow' && <><path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M8 20a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3m4 4h4m-4 4h4" /><path d="m16 14 2 2 3-3" /></>}
        {name === 'return' && <><path d="M9 7 4 12l5 5" /><path d="M4 12h10a5 5 0 0 1 5 5v2" /></>}
        {name === 'memberList' && <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1a4.5 4.5 0 0 1 4.5-4.5h2a4.5 4.5 0 0 1 4.5 4.5v1m1-13h5m-5 4h5m-5 4h5" /></>}
        {name === 'reports' && <><path d="M4 20V11m5 9V5m5 15v-7m5 7V8" /></>}
        {name === 'invoice' && <><path d="M6 3.5h9l4 4V20H6z" /><path d="M14.5 3.5V8H19M9 12h7m-7 4h7" /></>}
        {name === 'catalog' && <><circle cx="12" cy="12" r="8.5" /><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1z" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2" /></>}
        {name === 'subjects' && <><path d="m6 18 7.5-7.5" /><path d="m12.5 4 .8 2.2L15.5 7l-2.2.8-.8 2.2-.8-2.2L9.5 7l2.2-.8z" /><path d="m18 12 .6 1.4L20 14l-1.4.6L18 16l-.6-1.4L16 14l1.4-.6z" /><path d="m5 5 .5 1.5L7 7l-1.5.5L5 9l-.5-1.5L3 7l1.5-.5z" /></>}
        {name === 'trending' && <><path d="M4 18 10 12l4 3 6-8" /><path d="M14 7h6v6" /></>}
    </svg>
);

const getColorTheme = (value: string | null): ColorTheme => {
    return value === 'botanical' || value === 'coastal' ? value : 'wood';
};

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [browseOpen, setBrowseOpen] = useState(false);
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => getColorTheme(localStorage.getItem('blib-color-theme')));
    const browseMenuRef = useRef<HTMLDivElement>(null);

    const userStr = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('userType');

    const user = userStr ? JSON.parse(userStr) : null;
    const userName = user?.fullName || '';
    const roleLabel = userType === 'LIBRARIAN' ? 'Librarian' : (userType === 'MEMBER' ? 'Member' : '');

    useEffect(() => {
        document.documentElement.dataset.theme = colorTheme;
        localStorage.setItem('blib-color-theme', colorTheme);
    }, [colorTheme]);

    useEffect(() => {
        const handleUnload = () => {
            const currentStr = localStorage.getItem('currentUser');
            const currentType = localStorage.getItem('userType');

            if (currentStr && currentType) {
                const currentUser = JSON.parse(currentStr);

                const endpoint = currentType === 'LIBRARIAN' 
                    ? `/librarians/${currentUser.librarianId}/login-status`
                    : `/members/${currentUser.memberId}/login-status`;

                fetch(`http://localhost:8080/api${endpoint}?status=false`, {
                    method: 'PUT',
                    keepalive: true
                });
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    useEffect(() => {
        if (!browseOpen) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!browseMenuRef.current?.contains(event.target as Node)) {
                setBrowseOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setBrowseOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [browseOpen]);

    const handleLogout = async () => {
        await authService.logout(); // Triggers the DB update and clears session
        navigate('/login');
    };

    const isLibrarian = userType === 'LIBRARIAN';
    const browseLinks = isLibrarian
        ? [
            { path: '/librarian-dashboard', label: 'Dashboard', icon: 'dashboard' as const },
            { path: '/manage-members', label: 'Manage Members', icon: 'members' as const },
            { path: '/register-member', label: 'Register Member', icon: 'addMember' as const },
            { path: '/borrow-book', label: 'Borrow Book', icon: 'borrow' as const },
            { path: '/return-book', label: 'Return Book', icon: 'return' as const },
            { path: '/view-member', label: 'View Members', icon: 'memberList' as const },
            { path: '/reports', label: 'Reports', icon: 'reports' as const },
            { path: '/invoices', label: 'Invoices', icon: 'invoice' as const }
          ]
        : [
            { path: '', label: 'Subjects', icon: 'subjects' as const },
            { path: '', label: 'Trending', icon: 'trending' as const },
            { path: '/catalog', label: 'Library Explorer', icon: 'catalog' as const }
          ];
    const navItemClass = 'nav-item flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-base font-semibold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border';

    return (
        <div className="flex min-h-screen flex-col bg-page font-sans">
            {/* TOP HEADER */}
            <header className="flex items-center bg-header px-8 py-4"></header>

            {/* HORIZONTAL NAV BAR */}
            <nav className="bg-transparent px-4 pt-4">
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                        <button className="shrink-0 whitespace-nowrap font-extrabold text-[26px] text-primary" onClick={() => navigate('/home')}>
                            Blib Library
                        </button>
                    {!isLibrarian && (
                        <button
                            className={navItemClass}
                            onClick={() => navigate('/my-books')}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                                <path d="M6.5 4.75h11v15l-5.5-3.5-5.5 3.5z" />
                            </svg>
                            My Books
                        </button>
                    )}

                    <div className="relative" ref={browseMenuRef}>
                        <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={browseOpen}
                            className={navItemClass}
                            onClick={() => setBrowseOpen(open => !open)}
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 5.5c3.4-.9 6.5-.3 9 1.6v13c-2.5-1.9-5.6-2.5-9-1.6z" />
                                <path d="M21 5.5c-3.4-.9-6.5-.3-9 1.6v13c2.5-1.9 5.6-2.5 9-1.6z" />
                                <path d="M12 7.1v13M5.5 9.2c1.8-.3 3.4 0 4.8.7m8.2-.7c-1.8-.3-3.4 0-4.8.7M5.5 12c1.8-.3 3.4 0 4.8.7m8.2-.7c-1.8-.3-3.4 0-4.8.7" />
                            </svg>
                            Browse
                            <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${browseOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="m5 7.5 5 5 5-5" />
                            </svg>
                        </button>

                        {browseOpen && (
                            <div className="absolute start-0 top-full z-20 mt-1 w-64 border border-border-subtle bg-surface py-2 shadow-[0_8px_24px_rgba(var(--color-shadow),0.16)]" role="menu" aria-label="Browse pages">
                                {browseLinks.map(link => {
                                    const isActive = location.pathname.startsWith(link.path);
                                    return (
                                        <button
                                            key={link.path}
                                            role="menuitem"
                                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors ${
                                                isActive
                                                    ? 'bg-accent-subtle font-semibold text-primary'
                                                    : 'text-secondary hover:bg-surface-soft hover:text-primary'
                                            }`}
                                            onClick={() => {
                                                setBrowseOpen(false);
                                                navigate(link.path);
                                            }}
                                        >
                                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-surface-soft text-accent-text">
                                                <BrowseLinkIcon name={link.icon} />
                                            </span>
                                            {link.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    </div>

                    <div className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
                        <div className="flex min-w-[12rem] max-w-[350px] flex-1 basis-48 items-center rounded-full bg-surface px-4 py-1">
                            <input type="text" className="w-full bg-transparent text-sm text-primary outline-none" placeholder="Search Title / Author..." />
                        </div>

                        {user && (
                            <button className="flex shrink-0 items-center gap-3 rounded-full px-3 py-1 hover:bg-accent-wash" onClick={() => navigate('/personal-info')}>
                                <div className="flex flex-col whitespace-nowrap text-start">
                                    <span className="font-extrabold text-sm text-primary">{userName}</span>
                                    <span className="text-[11px] text-muted">{roleLabel}</span>
                                </div>
                            </button>
                        )}

                        <button className="shrink-0 whitespace-nowrap rounded-full border-[1.2px] border-accent-border px-4 py-1 text-xs font-extrabold text-accent-text transition-colors hover:bg-accent-solid hover:text-inverse"
                            onClick={user ? handleLogout : () => navigate('/login')}
                        >
                            {user ? 'Logout' : 'Login'}
                        </button>
                        <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs font-semibold text-secondary">
                            Theme
                            <select
                                aria-label="Color theme"
                                className="rounded-md border border-border bg-surface px-2 py-1.5 text-primary"
                                value={colorTheme}
                                onChange={event => setColorTheme(getColorTheme(event.currentTarget.value))}
                            >
                                <option value="wood">Wood</option>
                                <option value="botanical">Botanical</option>
                                <option value="coastal">Coastal</option>
                            </select>
                        </label>
                    </div>
                </div>
            </nav>

            {/* DYNAMIC CENTER CONTENT */}
            <main className="mx-auto my-4 w-[calc(100%-2rem)] max-w-6xl flex-grow rounded-xl bg-surface shadow-[0_8px_28px_rgba(var(--color-shadow),0.08)]">
                <Outlet />
            </main>

        </div>
    );
};

export default Layout;