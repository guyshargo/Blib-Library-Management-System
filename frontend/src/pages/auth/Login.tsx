import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { LoginRole } from '../../types/enums';

type ColorTheme = 'wood' | 'botanical' | 'coastal';

const getColorTheme = (value: string | null): ColorTheme => {
    return value === 'botanical' || value === 'coastal' ? value : 'wood';
};

const Login: React.FC = () => {
    const [role, setRole] = useState<LoginRole>('MEMBER');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => getColorTheme(localStorage.getItem('blib-color-theme')));

    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.dataset.theme = colorTheme;
        localStorage.setItem('blib-color-theme', colorTheme);
    }, [colorTheme]);

    const handleRoleChange = (selectedRole: LoginRole) => {
        setRole(selectedRole);
        setErrorMessage('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            if (role === 'MEMBER') {
                const member = await authService.loginMember(username, password);
                alert(`Welcome back, ${member.fullName}!`);
                navigate('/home');
            } else {
                const librarian = await authService.loginLibrarian(username, password);
                alert(`Welcome back, ${librarian.fullName}!`);
                navigate('/home');
            }
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 404) {
                setErrorMessage('Incorrect username or password. Check your details and try again.');
            } else if (error.message === 'The user is already logged into the system.') {
                setErrorMessage(error.message);
            } else if (error.code === 'ERR_NETWORK') {
                setErrorMessage('Unable to connect to the server. Check your connection and try again.');
            } else {
                setErrorMessage('Unable to sign in. Check your details and try again.');
            }
        }
    };

    return (
        <main className="relative flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-6 font-sans text-primary sm:px-8 sm:py-10">
            {/* Theme Picker Corner Widget */}
            <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-8">
                <label className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm">
                    <span>Theme</span>
                    <select
                        aria-label="Color theme"
                        className="rounded border border-border bg-input px-2 py-1 text-xs text-primary outline-none focus:ring-1 focus:ring-accent-border"
                        value={colorTheme}
                        onChange={event => setColorTheme(getColorTheme(event.currentTarget.value))}
                    >
                        <option value="wood">Timber (Wood)</option>
                        <option value="botanical">Oak (Botanical)</option>
                        <option value="coastal">Bay (Coastal)</option>
                    </select>
                </label>
            </div>

            <div className="mx-auto my-auto flex min-h-[min(760px,calc(100dvh-3rem))] w-full max-w-6xl flex-col overflow-hidden bg-surface shadow-[0_12px_40px_rgba(var(--color-shadow),0.12)] md:min-h-[680px] md:flex-row">
                <section className="flex w-full flex-col justify-center bg-accent-subtle px-8 py-12 sm:px-12 md:w-[46%] md:px-16 lg:px-20">
                    <div className="max-w-md">
                        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                            Your library, wherever you are
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
                            {colorTheme === 'botanical' ? 'Oak Library' : (colorTheme === 'coastal' ? 'Bay Library' : 'Timber Library')}
                        </h1>
                        <p className="mt-6 max-w-sm text-lg leading-8 text-muted">
                            Sign in to borrow books, manage your reading, and stay connected with your library.
                        </p>
                    </div>

                    <div className="mt-12 border-t border-border-subtle pt-6">
                        <p className="text-sm text-muted">Just browsing?</p>
                        <button
                            type="button"
                            className="mt-2 text-sm font-semibold text-accent-text underline decoration-accent-text underline-offset-4 transition-colors can-hover:text-accent-text"
                            onClick={() => navigate('/home')}
                        >
                            Continue as a guest
                        </button>
                    </div>
                </section>

                <section className="flex flex-1 items-center justify-center px-7 py-12 sm:px-12 md:px-14 lg:px-20">
                    <div className="w-full max-w-md">
                        <h2 className="text-3xl font-semibold tracking-tight text-primary">Log in</h2>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            Enter your account details to access the library.
                        </p>

                        <div className="mt-8 flex border-b border-border-subtle" role="tablist" aria-label="Login type">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={role === 'MEMBER'}
                                className={`-mb-px border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                                    role === 'MEMBER'
                                        ? 'border-accent-border text-primary'
                                        : 'border-transparent text-secondary can-hover:text-primary'
                                }`}
                                onClick={() => handleRoleChange('MEMBER')}
                            >
                                Member
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={role === 'LIBRARIAN'}
                                className={`-mb-px border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                                    role === 'LIBRARIAN'
                                        ? 'border-accent-border text-primary'
                                        : 'border-transparent text-secondary can-hover:text-primary'
                                }`}
                                onClick={() => handleRoleChange('LIBRARIAN')}
                            >
                                Librarian
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="mt-7 space-y-5">
                            <div>
                                <label htmlFor="login-username" className="mb-2 block text-sm font-semibold text-secondary">
                                    Username
                                </label>
                                <input
                                    id="login-username"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary outline-none transition focus:border-accent-border focus:ring-2 focus:ring-accent-wash"
                                />
                            </div>

                            <div>
                                <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-secondary">
                                    Password
                                </label>
                                <input
                                    id="login-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary outline-none transition focus:border-accent-border focus:ring-2 focus:ring-accent-wash"
                                />
                            </div>

                            {errorMessage && (
                                <div className="border-l-4 border-danger-border bg-danger-subtle px-3 py-2.5 text-sm text-danger-text" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-accent-solid px-4 py-3 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2"
                            >
                                Sign in as {role.toLowerCase()}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Login;
