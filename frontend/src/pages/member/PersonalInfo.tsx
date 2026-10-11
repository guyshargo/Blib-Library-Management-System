import React, { useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '../../components/DataTable';
import { memberService } from '../../services/memberService';
import type { Activity, Member } from '../../types';

type MemberWithBackendFields = Member & {
    phoneNumber?: string;
    emailAddress?: string;
};

const PersonalInfo: React.FC = () => {
    const [member, setMember] = useState<Member | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const storedMember: MemberWithBackendFields = JSON.parse(userStr);
            const currentMember: Member = {
                ...storedMember,
                phoneNum: storedMember.phoneNum ?? storedMember.phoneNumber ?? '',
                email: storedMember.email ?? storedMember.emailAddress ?? '',
            };
            setMember(currentMember);
            loadActivities(currentMember.memberId);
        } else {
            setActivitiesLoading(false);
        }
    }, []);

    const loadActivities = async (memberId: number) => {
        try {
            const data = await memberService.getActivities(memberId);
            setActivities(data);
        } catch (error) {
            console.error('Data Error: Could not load activities', error);
            setActivitiesError(true);
        } finally {
            setActivitiesLoading(false);
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
            const updatedSub = await memberService.updateContact(member.memberId, phone, email);
            const updatedMember = { ...updatedSub, phoneNum: phone, email };
            setMember(updatedMember);
            localStorage.setItem('currentUser', JSON.stringify(updatedMember));
            alert("Personal information updated successfully.");
        } catch (error) {
            alert("Network connection failed or failed to update on server.");
        }
    };

    if (!member) {
        return (
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                <p className="text-sm text-muted" role="status">Loading personal information...</p>
            </div>
        );
    }

    const inputClass = "w-full min-w-0 border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary read-only:bg-surface-soft read-only:text-secondary";
    const btnClass = "inline-flex min-h-11 shrink-0 items-center justify-center border border-accent-border bg-surface px-4 py-2.5 text-sm font-semibold text-accent-text transition-colors hover:bg-accent-solid hover:text-inverse focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2";
    const isFrozen = member.freezeStatus === 'FROZEN';
    const activityColumns: DataTableColumn<Activity>[] = [
        {
            key: 'date-time',
            header: 'Date & time',
            headerClassName: 'w-[38%] border-e border-border-subtle',
            cellClassName: 'border-e border-border-subtle',
            render: activity => new Date(activity.activityDateTime).toLocaleString(),
        },
        {
            key: 'activity-type',
            header: 'Activity type',
            headerClassName: 'w-[28%] border-e border-border-subtle',
            cellClassName: 'border-e border-border-subtle',
            render: activity => activity.type,
        },
        {
            key: 'description',
            header: 'Description (entity ID)',
            render: activity => activity.affectedEntityId,
        },
    ];

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 font-sans text-primary sm:px-8 sm:py-10">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Your account</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Personal information</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                    Review your membership details and update your contact information.
                </p>
            </header>

            <section className="space-y-5" aria-labelledby="account-details-heading">
                <h2 id="account-details-heading" className="text-xl font-semibold tracking-tight text-primary">Account details</h2>
                <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                    <div className="min-w-0 space-y-2">
                        <label htmlFor="membership-number" className="block text-sm font-semibold text-secondary">Membership number</label>
                        <output id="membership-number" className="flex min-w-0 items-center justify-between gap-3 border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary">
                            <span>{member.memberId}</span>
                            <span className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                isFrozen
                                    ? 'border-danger-border bg-danger-subtle text-danger-text'
                                    : 'border-success-dark bg-success-subtle text-success-dark'
                            }`}>
                                {isFrozen ? 'Frozen' : 'Not Frozen'}
                            </span>
                        </output>
                    </div>

                    <div className="min-w-0 space-y-2">
                        <label htmlFor="member-phone" className="block text-sm font-semibold text-secondary">Phone number</label>
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                            <input id="member-phone" type="tel" className={inputClass} readOnly value={member.phoneNum} />
                            <button type="button" className={btnClass} onClick={handleUpdatePhone}>Update phone number</button>
                        </div>
                    </div>

                    <div className="min-w-0 space-y-2">
                        <label htmlFor="member-email" className="block text-sm font-semibold text-secondary">Email address</label>
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                            <input id="member-email" type="email" className={inputClass} readOnly value={member.email} />
                            <button type="button" className={btnClass} onClick={handleUpdateEmail}>Update email</button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4" aria-labelledby="activities-heading">
                <div>
                    <h2 id="activities-heading" className="text-xl font-semibold tracking-tight text-primary">Recent activity</h2>
                    <p className="mt-1 text-sm text-muted">A record of activity associated with your membership.</p>
                </div>

                <DataTable
                    columns={activityColumns}
                    rows={activities}
                    getRowKey={activity => `${activity.memberId}-${activity.activityDateTime}-${activity.type}-${activity.affectedEntityId}`}
                    tableClassName="table-fixed"
                    loadingMessage={activitiesLoading ? 'Loading activity...' : undefined}
                    errorMessage={activitiesError ? 'Activity could not be loaded. Please try again later.' : undefined}
                    emptyMessage="No activities found yet."
                />
            </section>
        </div>
    );
};

export default PersonalInfo;