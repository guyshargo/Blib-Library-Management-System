import React, { useEffect, useState } from 'react';
import { memberService } from '../../services/memberService';
import type { Activity, Member } from '../../types';

const PersonalInfo: React.FC = () => {
    const [member, setMember] = useState<Member | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const sub: Member = JSON.parse(userStr);
            setMember(sub);
            loadActivities(sub.id);
        }
    }, []);

    const loadActivities = async (memberId: number) => {
        try {
            const data = await memberService.getActivities(memberId);
            setActivities(data);
        } catch (error) {
            console.error('Data Error: Could not load activities', error);
        }
    };

    const handleUpdatePhone = async () => {
        if (!member) return;
        const newPhone = window.prompt("Update Phone Number\nPlease enter new Phone Number here:", member.phoneNum);

        if (newPhone === null) return;
        if (newPhone.length !== 10 || !/^\d+$/.test(newPhone)) {
            alert("Phone number must be 10 digits and contain only numbers.");
            return;
        }
        await updateContactData(newPhone, member.email);
    };

    const handleUpdateEmail = async () => {
        if (!member) return;
        const newEmail = window.prompt("Update Email Address\nPlease enter new Email Address here:", member.email);

        if (newEmail === null) return;
        if (!newEmail.includes("@") || !newEmail.includes(".")) {
            alert("Please enter a valid email address.");
            return;
        }
        await updateContactData(member.phoneNum, newEmail);
    };

    const updateContactData = async (phone: string, email: string) => {
        if (!member) return;
        try {
            const updatedSub = await memberService.updateContact(member.id, phone, email);
            setMember(updatedSub);
            localStorage.setItem('currentUser', JSON.stringify(updatedSub));
            alert("Personal information updated successfully.");
        } catch (error) {
            alert("Network connection failed or failed to update on server.");
        }
    };

    if (!member) return <div>Loading...</div>;

    const inputClass = "rounded-[17px] text-sm px-[15px] py-2 border border-border bg-input read-only:bg-neutral read-only:text-secondary read-only:cursor-not-allowed";
    const btnClass = "bg-accent-subtle rounded-full text-primary text-base font-semibold border-2 border-transparent px-5 py-2 cursor-pointer transition-all duration-200 hover:bg-accent-subtle-hover hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]";

    return (
        <div className="flex flex-col p-[30px] font-sans min-h-screen gap-[30px]">
            <div className="flex gap-10 items-center">
                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-primary">Membership Number:</span>
                    <input className={inputClass} readOnly value={member.id} />
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-primary">Member freeze status:</span>
                    <input className={inputClass} readOnly value={member.freezeStatus} />
                </div>
            </div>

            <div className="flex gap-10 items-center">
                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-primary">Phone Number:</span>
                    <input className={inputClass} readOnly value={member.phoneNum} />
                    <button className={btnClass} onClick={handleUpdatePhone}>Update Phone Number</button>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-primary">Email Address:</span>
                    <input className={inputClass} readOnly value={member.email} />
                    <button className={btnClass} onClick={handleUpdateEmail}>Update Email</button>
                </div>
            </div>

            <div>
                <h3 className="text-base font-bold text-primary mb-2.5">Activities:</h3>
                <table className="w-full bg-surface rounded-[5px] border-collapse border-2 border-accent-subtle font-semibold">
                    <thead>
                        <tr>
                            <th className="bg-table-header p-2.5 text-left border-r border-border-subtle">Date & Time</th>
                            <th className="bg-table-header p-2.5 text-left border-r border-border-subtle">Activity Type</th>
                            <th className="bg-table-header p-2.5 text-left border-r border-border-subtle">Description (Entity ID)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length === 0 ? (
                            <tr><td colSpan={3} className="p-2.5 border-r border-border-subtle border-b border-border-subtle">No activities found yet.</td></tr>
                        ) : (
                            activities.map((act, idx) => (
                                <tr key={idx} className="odd:bg-surface-soft even:bg-surface hover:bg-row-hover hover:cursor-pointer">
                                    <td className="p-2.5 border-r border-border-subtle border-b border-border-subtle">{new Date(act.activityDateTime).toLocaleString()}</td>
                                    <td className="p-2.5 border-r border-border-subtle border-b border-border-subtle">{act.type}</td>
                                    <td className="p-2.5 border-r border-border-subtle border-b border-border-subtle">{act.entityId}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PersonalInfo;