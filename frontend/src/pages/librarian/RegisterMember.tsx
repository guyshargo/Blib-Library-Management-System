import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import { activityService } from '../../services/activityService';
import FormField from '../../components/FormField';
import Button from '../../components/Button';

type ColorTheme = 'wood' | 'botanical' | 'coastal' | 'ruby' | 'amethyst';

const getColorTheme = (value: string | null): ColorTheme => {
    return value === 'botanical' || value === 'coastal' || value === 'ruby' || value === 'amethyst' ? value : 'wood';
};

const RegisterMember: React.FC = () => {
    const [id, setId] = useState('');
    const [fullName, setFullName] = useState('');
    const [userName, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => getColorTheme(localStorage.getItem('blib-color-theme')));

    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.dataset.theme = colorTheme;
        localStorage.setItem('blib-color-theme', colorTheme);
    }, [colorTheme]);

    const handleClear = () => {
        setId(''); setFullName(''); setUsername('');
        setPassword(''); setPhone(''); setEmail('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id.trim() || !fullName.trim() || !userName.trim() || !password.trim() || !phone.trim() || !email.trim()) {
            alert("Please fill all fields to complete registration.");
            return;
        }

        if (!/^\d+$/.test(phone) || phone.length !== 10) {
            alert("Please enter: a valid phone number with only digits and with only 10 digits.");
            return;
        }

        if (!/^\d+$/.test(id) || id.length !== 9) {
            alert("Please enter a valid ID with only digits and with only 9 digits.");
            return;
        }

        if (!email.includes("@") || !email.includes(".")) {
            alert("Please enter a valid email address.");
            return;
        }

        try {
            const newMemberId = parseInt(id, 10);

            await librarianService.registerMember({
                memberId: newMemberId,
                fullName,
                userName,
                password,
                phone,
                email
            });

            await activityService.addActivity({
                memberId: newMemberId,
                type: 'REGISTRATION',
                affectedEntityId: newMemberId,
            });

            alert("You have been successfully registered! Please sign in with your new account.");
            navigate('/login');
        } catch (error: any) {
            alert(error.response?.data || "Registration Failed.");
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
                        <option value="ruby">Ruby (Crimson)</option>
                        <option value="amethyst">Amethyst (Berry)</option>
                    </select>
                </label>
            </div>

            <div className="mx-auto my-auto flex min-h-[min(760px,calc(100dvh-3rem))] w-full max-w-6xl flex-col overflow-hidden bg-surface shadow-[0_12px_40px_rgba(var(--color-shadow),0.12)] md:min-h-[680px] md:flex-row">
                <section className="flex w-full flex-col justify-center bg-accent-subtle px-8 py-12 sm:px-12 md:w-[42%] md:px-14 lg:px-16">
                    <div className="max-w-md">
                        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                            Join Our Community
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
                            Create Account
                        </h1>
                        <p className="mt-6 max-w-sm text-lg leading-8 text-muted">
                            Register a new library membership account to borrow books, track your reading history, and explore our collection.
                        </p>
                    </div>

                    <div className="mt-12 border-t border-border-subtle pt-6">
                        <p className="text-sm text-muted">Already have an account?</p>
                        <button
                            type="button"
                            className="mt-2 text-sm font-semibold text-accent-text underline decoration-accent-text underline-offset-4 transition-colors can-hover:text-accent-text"
                            onClick={() => navigate('/login')}
                        >
                            Sign in to your account
                        </button>
                    </div>
                </section>

                <section className="flex flex-1 items-center justify-center px-7 py-10 sm:px-12 md:px-12 lg:px-16 overflow-y-auto max-h-[90dvh]">
                    <div className="w-full max-w-md">
                        <h2 className="text-2xl font-semibold tracking-tight text-primary">Member Registration</h2>
                        <p className="mt-1 text-sm leading-5 text-muted">
                            Please fill in your details to create your library membership.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <FormField
                                label="Membership ID (9 digits)"
                                placeholder="e.g. 123456789"
                                value={id}
                                onChange={e => setId(e.target.value)}
                                labelClassName="text-sm font-semibold text-secondary"
                            />
                            <FormField
                                label="Full Name"
                                placeholder="e.g. Alex Morgan"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                labelClassName="text-sm font-semibold text-secondary"
                            />
                            <FormField
                                label="Username"
                                placeholder="Choose a username"
                                value={userName}
                                onChange={e => setUsername(e.target.value)}
                                labelClassName="text-sm font-semibold text-secondary"
                            />
                            <FormField
                                label="Password"
                                type="password"
                                placeholder="Choose a secure password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                labelClassName="text-sm font-semibold text-secondary"
                            />
                            <FormField
                                label="Phone Number (10 digits)"
                                placeholder="e.g. 5551234567"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                labelClassName="text-sm font-semibold text-secondary"
                            />
                            <FormField
                                label="Email Address"
                                type="email"
                                placeholder="member@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                labelClassName="text-sm font-semibold text-secondary"
                            />

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleClear}>
                                    Clear
                                </Button>
                                <Button type="submit" variant="primary" size="lg" className="flex-1">
                                    Register
                                </Button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default RegisterMember;
