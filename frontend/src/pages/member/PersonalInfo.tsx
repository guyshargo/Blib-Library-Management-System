import React, { useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '../../components/DataTable';
import Tag from '../../components/Tag';
import { memberService } from '../../services/memberService';
import { catalogService } from '../../services/catalogService';
import { borrowService } from '../../services/borrowService';
import { orderService } from '../../services/orderService';
import type { Activity, Member } from '../../types';

type MemberWithBackendFields = Member & {
    phoneNumber?: string;
    emailAddress?: string;
};

const PersonalInfo: React.FC = () => {
    const [member, setMember] = useState<Member | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [bookTitleMap, setBookTitleMap] = useState<Map<number, string>>(new Map());
    const [copyTitleMap, setCopyTitleMap] = useState<Map<number, string>>(new Map());
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
            void loadActivities(currentMember.memberId);
        } else {
            setActivitiesLoading(false);
        }
    }, []);

    const loadActivities = async (memberId: number) => {
        setActivitiesLoading(true);
        setActivitiesError(false);
        try {
            const [acts, catalogBooks, borrows, orders] = await Promise.all([
                memberService.getActivities(memberId),
                catalogService.searchBooks('is empty', 'is empty', 'is empty').catch(() => []),
                borrowService.getMemberBorrows(memberId).catch(() => []),
                orderService.getMemberOrders(memberId).catch(() => []),
            ]);

            const booksMap = new Map<number, string>();
            const copiesMap = new Map<number, string>();

            catalogBooks.forEach(b => {
                if (b.bookId && b.title) booksMap.set(b.bookId, b.title);
            });
            borrows.forEach(b => {
                if (b.bookId && b.title) booksMap.set(b.bookId, b.title);
                if (b.bookCopyId && b.title) copiesMap.set(b.bookCopyId, b.title);
            });
            orders.forEach(o => {
                if (o.bookId && o.title) booksMap.set(o.bookId, o.title);
            });

            await Promise.all(
                acts.map(async act => {
                    const id = act.affectedEntityId;
                    if (id && !booksMap.has(id) && !copiesMap.has(id)) {
                        try {
                            const book = await borrowService.getBookDetails(id);
                            if (book?.title) {
                                booksMap.set(id, book.title);
                            }
                        } catch {
                            // ignore if not a valid book ID
                        }
                    }
                })
            );

            setBookTitleMap(booksMap);
            setCopyTitleMap(copiesMap);

            const sortedActs = [...acts].sort(
                (a, b) => new Date(b.activityDateTime).getTime() - new Date(a.activityDateTime).getTime()
            );

            setActivities(sortedActs);
        } catch (error) {
            console.error('Data Error: Could not load activities', error);
            setActivitiesError(true);
        } finally {
            setActivitiesLoading(false);
        }
    };

    const handleUpdatePhone = async () => {
        if (!member) return;
        const newPhone = window.prompt("Update phone number\nEnter a 10-digit phone number:", member.phoneNum);

        if (newPhone === null) return;
        if (newPhone.length !== 10 || !/^\d+$/.test(newPhone)) {
            alert("Enter a phone number with exactly 10 digits.");
            return;
        }
        await updateContactData(newPhone, member.email);
    };

    const handleUpdateEmail = async () => {
        if (!member) return;
        const newEmail = window.prompt("Update email address\nEnter the new email address:", member.email);

        if (newEmail === null) return;
        if (!newEmail.includes("@") || !newEmail.includes(".")) {
            alert("Enter a valid email address.");
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
            alert("Personal information updated.");
        } catch (error) {
            alert("Unable to update your information. Check your connection and try again.");
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
    const btnClass = "inline-flex min-h-11 shrink-0 items-center justify-center border border-accent-border bg-surface px-4 py-2.5 text-sm font-semibold text-accent-text transition-colors can-hover:bg-accent-solid can-hover:text-inverse focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2";
    const isFrozen = member.freezeStatus === 'FROZEN';

    const formatActivityDescription = (activity: Activity) => {
        const type = (activity.type || '').toLowerCase();
        const entityId = activity.affectedEntityId;
        const isOrderActivity = type.includes('order') || type.includes('cancel');

        const resolvedTitle = isOrderActivity
            ? bookTitleMap.get(entityId)
            : (copyTitleMap.get(entityId) ?? bookTitleMap.get(entityId));
        const title = resolvedTitle || (entityId ? `Book #${entityId}` : '');

        if (type.includes('borrow')) {
            return title ? `Borrowed "${title}"` : 'Borrowed book';
        }
        if (type.includes('return') && !type.includes('late')) {
            return title ? `Returned "${title}"` : 'Returned book';
        }
        if (type.includes('late')) {
            return title ? `Returned "${title}" late` : 'Returned book late';
        }
        if (type.includes('extend')) {
            return title ? `Extended borrow period for "${title}"` : 'Extended book borrow';
        }
        if (type.includes('cancel')) {
            return title ? `Cancelled order for "${title}"` : 'Cancelled book order';
        }
        if (type.includes('order')) {
            return title ? `Ordered "${title}"` : 'Ordered book';
        }
        if (type.includes('registration') || type.includes('register')) {
            return 'Completed account registration';
        }
        if (type.includes('freeze')) {
            return 'Membership status updated';
        }
        return title ? `${activity.type}: "${title}"` : activity.type;
    };

    const renderActivityBadge = (type: string) => {
        const lower = (type || '').toLowerCase();
        let variant: 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'topic' = 'topic';
        let label = type;

        if (lower.includes('borrow')) {
            variant = 'info';
            label = 'Borrow';
        } else if (lower.includes('return') && !lower.includes('late')) {
            variant = 'success';
            label = 'Return';
        } else if (lower.includes('late')) {
            variant = 'danger';
            label = 'Late Return';
        } else if (lower.includes('extend')) {
            variant = 'accent';
            label = 'Extension';
        } else if (lower.includes('cancel')) {
            variant = 'danger';
            label = 'Cancelled Order';
        } else if (lower.includes('order')) {
            variant = 'warning';
            label = 'Order';
        } else if (lower.includes('register') || lower.includes('registration')) {
            variant = 'topic';
            label = 'Registration';
        } else if (lower.includes('freeze') || lower.includes('status')) {
            variant = 'danger';
            label = 'Account Status';
        } else if (lower.includes('default')) {
            variant = 'topic';
            label = 'Activity';
        }

        return <Tag label={label} variant={variant} />;
    };

    const activityColumns: DataTableColumn<Activity>[] = [
        {
            key: 'type',
            header: 'Activity type',
            headerClassName: 'w-[25%]',
            cellClassName: 'w-[25%]',
            render: activity => renderActivityBadge(activity.type),
        },
        {
            key: 'description',
            header: 'Details',
            headerClassName: 'w-[45%]',
            cellClassName: 'w-[45%] font-medium',
            render: activity => formatActivityDescription(activity),
        },
        {
            key: 'date-time',
            header: 'Date & time',
            headerClassName: 'w-[30%]',
            cellClassName: 'w-[30%] text-muted text-sm',
            render: activity => new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.activityDateTime)),
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
                    errorMessage={activitiesError ? (
                        <span className="inline-flex flex-wrap items-center justify-center gap-3">
                            <span>Unable to load activity.</span>
                            <button type="button" className="underline underline-offset-4" onClick={() => member && void loadActivities(member.memberId)}>Retry</button>
                        </span>
                    ) : undefined}
                    emptyMessage="No activities found yet."
                />
            </section>
        </div>
    );
};

export default PersonalInfo;