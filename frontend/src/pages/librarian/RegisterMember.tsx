import React, { useState } from 'react';
import { librarianService } from '../../services/librarianService';

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
            await librarianService.registerMember({
                memberId: parseInt(id),
                fullName,
                userName,
                password,
                phone,
                email
            });
            alert("You have been successfully registered.");
            handleClear();
        } catch (error: any) {
            alert(error.response?.data || "Registration Failed.");
        }
    };

    return (
        <div className="flex flex-col items-center p-[30px] font-sans min-h-screen gap-5">
            <div className="bg-surface-soft rounded-[25px] p-[30px] w-[500px] flex flex-col gap-[15px]">
                <div className="flex flex-row items-center">
                    <span className="text-base font-bold text-primary w-[160px]">ID:</span>
                    <input className="flex-1 rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none" value={id} onChange={e => setId(e.target.value)} />
                </div>
                <div className="flex flex-row items-center">
                    <span className="text-base font-bold text-primary w-[160px]">Full Name:</span>
                    <input className="flex-1 rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="flex flex-row items-center">
                    <span className="text-base font-bold text-primary w-[160px]">Username:</span>
                    <input className="flex-1 rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none" value={userName} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="flex flex-row items-center">
                    <span className="text-base font-bold text-primary w-[160px]">Password:</span>
                    <input className="flex-1 rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="flex flex-row items-center">
                    <span className="text-base font-bold text-primary w-[160px]">Phone Number:</span>
                    <input className="flex-1 rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="flex flex-row items-center">
                    <span className="text-base font-bold text-primary w-[160px]">Email Address:</span>
                    <input className="flex-1 rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            </div>

            <div className="flex gap-5 mt-[30px]">
                <button 
                    className="rounded-full text-primary text-base font-semibold border-2 border-transparent px-[25px] py-2.5 cursor-pointer transition-all duration-200 bg-info-strong hover:bg-info hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
                <button 
                    className="rounded-full text-primary text-base font-semibold border-2 border-transparent px-[25px] py-2.5 cursor-pointer transition-all duration-200 bg-warning-bright hover:bg-warning-soft hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default RegisterMember;