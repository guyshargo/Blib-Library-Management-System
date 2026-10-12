import React, { useState } from 'react';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';

const RegisterMember: React.FC = () => {
    const [id, setId] = useState('');
    const [fullName, setFullName] = useState('');
    const [userName, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const handleClear = () => {
        setId(''); setFullName(''); setUsername('');
        setPassword(''); setPhone(''); setEmail('');
    };

    const handleSubmit = async () => {
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

            await borrowService.addActivity({
                memberId: newMemberId,
                type: 'REGISTRATION',
                affectedEntityId: newMemberId
            });

            alert("You have been successfully registered.");
            handleClear();
        } catch (error: any) {
            alert(error.response?.data || "Registration Failed.");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center gap-5 p-4 font-sans sm:p-6">
            <div className="flex w-full max-w-xl flex-col gap-4 rounded-lg bg-surface p-4 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-primary sm:w-40">ID:</span>
                    <input className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" value={id} onChange={e => setId(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-primary sm:w-40">Full name:</span>
                    <input className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-primary sm:w-40">Username:</span>
                    <input className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" value={userName} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-primary sm:w-40">Password:</span>
                    <input className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-primary sm:w-40">Phone number:</span>
                    <input className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-primary sm:w-40">Email address:</span>
                    <input className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>

            <div className="mt-3 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                <button 
                    className="flex-1 rounded-md bg-accent-solid px-5 py-3 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
                <button 
                    className="flex-1 rounded-md border border-border bg-surface px-5 py-3 text-base font-semibold text-primary transition-colors can-hover:bg-surface-soft"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default RegisterMember;