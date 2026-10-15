import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import SearchModal from '../common/SearchModal';
import DropdownOption from '../ui/DropdownOption';
import BrowseIcon from '../ui/BrowseIcon';
import { librarianLinks, memberLinks } from '../../config/navigationConfig';

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const browseMenuRef = useRef<HTMLDivElement>(null);
    const [browseOpen, setBrowseOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const userStr = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('userType');

    const user = userStr ? JSON.parse(userStr) : null;
    const userName = user?.fullName || '';
    const roleLabel = userType === 'LIBRARIAN' ? 'Librarian' : (userType === 'MEMBER' ? 'Member' : '');

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
        await authService.logout();
        navigate('/login');
    };

    const isLibrarian = userType === 'LIBRARIAN';
    const browseLinks = isLibrarian ? librarianLinks : memberLinks;
    const headerButtonClass = 'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-sm font-semibold text-primary shadow-sm transition-colors can-hover:bg-surface-soft can-hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border';

    return (
        <div className="flex min-h-screen flex-col bg-page font-sans">
            {/* TOP HEADER */}
            <header className="flex items-center justify-between bg-header px-4 py-2.5 text-white sm:px-8">
                <span className="text-xs font-semibold tracking-wider uppercase opacity-90 truncate">
                    Blib Library System
                </span>
            </header>

            {/* HORIZONTAL NAV BAR */}
            <nav className="bg-transparent px-4 pt-4 sm:px-8">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-x-6">
                    {/* Left Group: Logo + Desktop Nav Items (My Books, Browse) */}
                    <div className="flex items-center justify-between gap-x-6 lg:justify-start">
                        <button className="shrink-0 whitespace-nowrap font-extrabold text-[20px] sm:text-[24px] text-primary flex items-center gap-2.5" onClick={() => navigate('/home')}>
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 text-accent-text shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                <path d="M6 6h12M6 10h12" />
                            </svg>
                            <span>Timber Library</span>
                        </button>

                        {/* Desktop Nav Items Group (My Books & Browse) */}
                        <div className="hidden lg:flex items-center gap-x-3">
                            {!isLibrarian && (
                                <button
                                    className={headerButtonClass}
                                    onClick={() => navigate('/my-books')}
                                >
                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
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
                                    className={headerButtonClass}
                                    onClick={() => setBrowseOpen(open => !open)}
                                >
                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 5.5c3.4-.9 6.5-.3 9 1.6v13c-2.5-1.9-5.6-2.5-9-1.6z" />
                                        <path d="M21 5.5c-3.4-.9-6.5-.3-9 1.6v13c2.5-1.9 5.6-2.5 9-1.6z" />
                                        <path d="M12 7.1v13M5.5 9.2c1.8-.3 3.4 0 4.8.7m8.2-.7c-1.8-.3-3.4 0-4.8.7M5.5 12c1.8-.3 3.4 0 4.8.7m8.2-.7c-1.8-.3-3.4 0-4.8.7" />
                                    </svg>
                                    Browse
                                    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-3.5 w-3.5 text-secondary transition-transform ${browseOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path d="m5 7.5 5 5 5-5" />
                                    </svg>
                                </button>

                                {browseOpen && (
                                    <div className="absolute start-0 top-full z-20 mt-1 w-64 border border-border-subtle bg-surface py-2 shadow-[0_8px_24px_rgba(var(--color-shadow),0.16)]" role="menu" aria-label="Browse pages">
                                        {browseLinks.map(link => {
                                            const isActive = Boolean(link.path) && location.pathname.startsWith(link.path);
                                            return (
                                                <DropdownOption
                                                    key={link.path}
                                                    label={link.label}
                                                    description={link.description}
                                                    icon={<BrowseIcon name={link.icon} />}
                                                    isActive={isActive}
                                                    onClick={() => {
                                                        setBrowseOpen(false);
                                                        navigate(link.path);
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile right controls: Search trigger + Hamburger */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                aria-label="Search books and authors"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary transition-colors can-hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border"
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                aria-label="Toggle navigation menu"
                                aria-expanded={mobileMenuOpen}
                                onClick={() => setMobileMenuOpen(open => !open)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-primary transition-colors can-hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border"
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {mobileMenuOpen ? (
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    ) : (
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Desktop Right Actions */}
                    <div className="hidden lg:flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            className="flex w-[180px] xl:w-[220px] items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-secondary transition-colors can-hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border"
                        >
                            <span>Search</span>
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-4 w-4 text-muted"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </button>

                        {user && (
                            <button
                                type="button"
                                aria-label="Mailbox / Invoices"
                                onClick={() => navigate('/invoices')}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-secondary transition-colors can-hover:bg-surface-soft can-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border"
                                title="Mailbox / Messages"
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <path d="m22 6-10 7L2 6" />
                                </svg>
                            </button>
                        )}

                        {user && (
                            <button className="flex shrink-0 items-center gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 can-hover:bg-surface-soft" onClick={() => navigate('/personal-info')}>
                                <div className="flex flex-col whitespace-nowrap text-start">
                                    <span className="font-extrabold text-sm text-primary">{userName}</span>
                                    <span className="text-xs text-muted">{roleLabel}</span>
                                </div>
                            </button>
                        )}

                        <button className="shrink-0 whitespace-nowrap rounded-lg border border-accent-border bg-accent-solid px-4 py-2 text-xs font-bold text-inverse transition-opacity can-hover:opacity-90"
                            onClick={user ? handleLogout : () => navigate('/login')}
                        >
                            {user ? 'Logout' : 'Login'}
                        </button>
                    </div>

                    {/* Mobile Collapsible Navigation Drawer */}
                    {mobileMenuOpen && (
                        <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-4 shadow-lg lg:hidden" role="navigation" aria-label="Mobile navigation">
                            {!isLibrarian && (
                                <button
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-secondary hover:bg-surface-soft text-start"
                                    onClick={() => { setMobileMenuOpen(false); navigate('/my-books'); }}
                                >
                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                                        <path d="M6.5 4.75h11v15l-5.5-3.5-5.5 3.5z" />
                                    </svg>
                                    My Books
                                </button>
                            )}

                            <div className="font-bold text-xs uppercase tracking-wider text-muted px-3 pt-2">Browse Catalog</div>
                            {browseLinks.map(link => (
                                <button
                                    key={link.path}
                                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-soft text-start"
                                    onClick={() => { setMobileMenuOpen(false); navigate(link.path); }}
                                >
                                    <span className="text-accent-text"><BrowseIcon name={link.icon} /></span>
                                    {link.label}
                                </button>
                            ))}

                            {user && (
                                <div className="mt-2 border-t border-border-subtle pt-3 flex flex-col gap-3">
                                    <div className="flex items-center justify-between px-3">
                                        <div>
                                            <div className="font-extrabold text-sm text-primary">{userName}</div>
                                            <div className="text-xs text-muted">{roleLabel}</div>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Mailbox / Invoices"
                                            onClick={() => { setMobileMenuOpen(false); navigate('/invoices'); }}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-secondary transition-colors"
                                        >
                                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <path d="m22 6-10 7L2 6" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        className="rounded-md bg-accent-solid px-4 py-2 text-center text-xs font-bold text-inverse"
                                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}

                            {!user && (
                                <button
                                    className="mt-2 rounded-md bg-accent-solid px-4 py-2 text-center text-xs font-bold text-inverse"
                                    onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* DYNAMIC CENTER CONTENT */}
            <main className="mx-auto my-4 w-[calc(100%-2rem)] max-w-6xl flex-grow rounded-xl bg-surface shadow-[0_8px_28px_rgba(var(--color-shadow),0.08)]">
                <Outlet />
            </main>
            
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
    );
};

export default Layout;
