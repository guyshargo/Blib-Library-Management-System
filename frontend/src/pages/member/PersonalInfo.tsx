import React, { useEffect, useState } from 'react';
import DataTable, { type DataTableColumn } from '../../components/DataTable';
import Tag from '../../components/Tag';
import FormField from '../../components/FormField';
import { activityService } from '../../services/activityService';
import { memberService } from '../../services/memberService';
import { borrowService } from '../../services/borrowService';
import { orderService } from '../../services/orderService';
import type { Activity } from '../../types';
import { ACTIVITY_CONFIG } from '../../config/activityConfig';

const PersonalInfo: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [isLibrarian, setIsLibrarian] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [bookTitleMap, setBookTitleMap] = useState<Map<number, string>>(new Map());
    const [copyTitleMap, setCopyTitleMap] = useState<Map<number, string>>(new Map());
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        const userType = localStorage.getItem('userType');
        
        if (userStr && userType) {
            const parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
            setIsLibrarian(userType === 'LIBRARIAN');
            const userId = userType === 'LIBRARIAN' ? parsedUser.librarianId : parsedUser.memberId;
            void loadActivities(userId, userType === 'LIBRARIAN');
        } else {
            setActivitiesLoading(false);
        }
    }, []);

    const loadActivities = async (userId: number, librarianStatus: boolean) => {
        setActivitiesLoading(true);
        setActivitiesError(false);
        try {
            const actsPromise = librarianStatus 
                ? activityService.getLibrarianActivities(userId)
                : activityService.getMemberActivities(userId);

            // 1. Removed the massive catalogService.searchBooks call
            const [acts, borrows, orders] = await Promise.all([
                actsPromise,
                borrowService.getMemberBorrows(userId).catch(() => []),
                orderService.getMemberOrders(userId).catch(() => []),
            ]);

            const booksMap = new Map<number, string>();
            const copiesMap = new Map<number, string>();

            // 2. Map titles directly from the active borrows and orders
            borrows.forEach(b => {
                if (b.bookId && b.title) booksMap.set(b.bookId, b.title);
                if (b.bookCopyId && b.title) copiesMap.set(b.bookCopyId, b.title);
            });
            orders.forEach(o => { 
                if (o.bookId && o.title) booksMap.set(o.bookId, o.title); 
            });

            // 3. Fallback to fetch individual book details for old historical activities
            await Promise.all(
                acts.map(async act => {
                    const id = act.affectedEntityId;
                    if (id && !booksMap.has(id) && !copiesMap.has(id)) {
                        try {
                            const book = await borrowService.getBookDetails(id);
                            if (book?.title) booksMap.set(id, book.title);
                        } catch {
                            // ignore if not a valid book ID
                        }
                    }
                })
            );

            setBookTitleMap(booksMap);
            setCopyTitleMap(copiesMap);
            setActivities(acts); 
        } catch (error) {
            console.error('Data Error: Could not load activities', error);
            setActivitiesError(true);
        } finally {
            setActivitiesLoading(false);
        }
    };

    const handleUpdatePhone = async () => {
        if (!user || isLibrarian) return; 
        const newPhone = window.prompt("Update phone number\nEnter a 10-digit phone number:", user.phoneNum);

        if (newPhone === null) return;
        if (newPhone.length !== 10 || !/^\d+$/.test(newPhone)) {
            alert("Enter a phone number with exactly 10 digits.");
            return;
        }
        await updateContactData(newPhone, user.email);
    };

    const handleUpdateEmail = async () => {
        if (!user || isLibrarian) return;
        const newEmail = window.prompt("Update email address\nEnter the new email address:", user.email);

        if (newEmail === null) return;
        if (!newEmail.includes("@") || !newEmail.includes(".")) {
            alert("Enter a valid email address.");
            return;
        }
        await updateContactData(user.phoneNum, newEmail);
    };

    const updateContactData = async (phone: string, email: string) => {
        if (!user) return;
        try {
            const updatedSub = await memberService.updateContact(user.memberId, phone, email);
            const updatedMember = { ...updatedSub, phoneNum: phone, email };
            setUser(updatedMember);
            localStorage.setItem('currentUser', JSON.stringify(updatedMember));
            alert("Personal information updated.");
        } catch (error) {
            alert("Unable to update your information. Check your connection and try again.");
        }
    };

    const formatActivityDescription = React.useCallback((activity: Activity) => {
        const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG['DEFAULT'];
        const entityId = activity.affectedEntityId;
        const isOrderActivity = activity.type === 'ORDER' || activity.type === 'CANCEL_ORDER';

        const resolvedTitle = isOrderActivity
            ? bookTitleMap.get(entityId)
            : (copyTitleMap.get(entityId) ?? bookTitleMap.get(entityId));
        
        const title = resolvedTitle || (entityId ? `Book #${entityId}` : '');
        const actionText = config.formatDescription(title);

        return isLibrarian ? `Member #${activity.memberId}: ${actionText}` : actionText;
    }, [bookTitleMap, copyTitleMap, isLibrarian]);

    const activityColumns = React.useMemo<DataTableColumn<Activity>[]>(() => [
        {
            key: 'type',
            header: 'Activity type',
            headerClassName: 'w-[25%]',
            cellClassName: 'w-[25%]',
            render: activity => {
                const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG['DEFAULT'];
                return <Tag label={config.label} variant={config.variant} />;
            },
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
            render: activity => new Intl.DateTimeFormat(navigator.language, { 
                dateStyle: 'medium', timeStyle: 'short' 
            }).format(new Date(activity.activityDateTime)),
        },
    ], [formatActivityDescription]);

    if (!user) {
        return (
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                <p className="text-sm text-muted" role="status">Loading personal information...</p>
            </div>
        );
    }

    const btnClass = "inline-flex min-h-11 shrink-0 items-center justify-center border border-accent-border bg-surface px-4 py-2.5 text-sm font-semibold text-accent-text transition-colors can-hover:bg-accent-solid can-hover:text-inverse focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2";
    
    const accountId = isLibrarian ? user.librarianId : user.memberId;
    const phone = user.phoneNum || '';
    const email = user.email || '';
    const isFrozen = !isLibrarian && user.freezeStatus === 'FROZEN';

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 font-sans text-primary sm:px-8 sm:py-10">
            {isLibrarian ? (
                <>
                    <header>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Staff Profile</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Librarian Information</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                            Review your staff credentials and recent staff activities.
                        </p>
                    </header>

                    <section className="space-y-5" aria-labelledby="account-details-heading">
                        <h2 id="account-details-heading" className="text-xl font-semibold tracking-tight text-primary">Staff credentials</h2>
                        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                            <div className="min-w-0 space-y-2">
                                <label htmlFor="account-number" className="block text-sm font-semibold text-secondary">
                                    Librarian ID
                                </label>
                                <output id="account-number" className="flex min-w-0 items-center justify-between gap-3 border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary">
                                    <span>{accountId}</span>
                                    <span className="shrink-0 rounded-md border border-accent-border bg-accent-wash px-2.5 py-1 text-xs font-semibold text-accent-text">
                                        Staff
                                    </span>
                                </output>
                            </div>

                            <div className="min-w-0 space-y-2">
                                <label htmlFor="staff-username" className="block text-sm font-semibold text-secondary">
                                    Username / Name
                                </label>
                                <output id="staff-username" className="flex min-w-0 items-center justify-between gap-3 border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary">
                                    <span>{user.fullName || user.username}</span>
                                    <span className="text-xs text-muted">@{user.username}</span>
                                </output>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <>
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
                                <label htmlFor="account-number" className="block text-sm font-semibold text-secondary">
                                    Membership number
                                </label>
                                <output id="account-number" className="flex min-w-0 items-center justify-between gap-3 border border-border-subtle bg-surface px-3.5 py-3 text-base text-primary">
                                    <span>{accountId}</span>
                                    <span className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                        isFrozen
                                            ? 'border-danger-border bg-danger-subtle text-danger-text'
                                            : 'border-success-dark bg-success-subtle text-success-dark'
                                    }`}>
                                        {isFrozen ? 'Frozen' : 'Not Frozen'}
                                    </span>
                                </output>
                            </div>

                            <div className="min-w-0">
                                <FormField
                                    label="Phone number"
                                    type="tel"
                                    value={phone}
                                    readOnly
                                    labelClassName="block text-sm font-semibold text-secondary"
                                    id="user-phone"
                                    actionButton={<button type="button" className={btnClass} onClick={handleUpdatePhone}>Update phone number</button>}
                                />
                            </div>

                            <div className="min-w-0">
                                <FormField
                                    label="Email address"
                                    type="email"
                                    value={email}
                                    readOnly
                                    labelClassName="block text-sm font-semibold text-secondary"
                                    id="user-email"
                                    actionButton={<button type="button" className={btnClass} onClick={handleUpdateEmail}>Update email</button>}
                                />
                            </div>
                        </div>
                    </section>
                </>
            )}

            <section className="space-y-4" aria-labelledby="activities-heading">
                <div>
                    <h2 id="activities-heading" className="text-xl font-semibold tracking-tight text-primary">Recent activity</h2>
                    <p className="mt-1 text-sm text-muted">A record of activity associated with your account.</p>
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
                            <button type="button" className="underline underline-offset-4" onClick={() => void loadActivities(accountId, isLibrarian)}>Retry</button>
                        </span>
                    ) : undefined}
                    emptyMessage="No activities found yet."
                />
            </section>
        </div>
    );
};

export default PersonalInfo;