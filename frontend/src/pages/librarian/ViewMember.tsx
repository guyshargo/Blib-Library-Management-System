import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import { activityService } from '../../services/activityService';
import type { Member, BorrowedBook, Activity } from '../../types';
import FormField from '../../components/FormField';
import Button from '../../components/Button';
import DataTable, { type DataTableColumn } from '../../components/DataTable';
import Tag from '../../components/Tag';
import { ACTIVITY_CONFIG } from '../../config/activityConfig';

const toLocalDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDate = (value: string) => new Intl.DateTimeFormat(navigator.language).format(toLocalDate(value));

const toApiDate = (date: Date = new Date()) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; // dd-MM-yyyy expected by backend
};

const ViewMember: React.FC = () => {
    const location = useLocation();
    const passedMember = location.state?.selectedMember as Member | undefined;

    const [member, setMember] = useState<Member | null>(passedMember ?? null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [borrows, setBorrows] = useState<BorrowedBook[]>([]);
    const [bookTitleMap, setBookTitleMap] = useState<Map<number, string>>(new Map());
    const [copyTitleMap, setCopyTitleMap] = useState<Map<number, string>>(new Map());
    
    const [filterQuery, setFilterQuery] = useState('');
    const [selectedCopyId, setSelectedCopyId] = useState<number | null>(null);
    const [extending, setExtending] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

    const loadData = useCallback(async (memberId: number) => {
        setLoadError(false);
        try {
            const [acts, books] = await Promise.all([
                activityService.getMemberActivities(memberId),
                borrowService.getMemberBorrows(memberId),
            ]);
            setActivities(acts);
            setBorrows(books);

            const booksMap = new Map<number, string>();
            const copiesMap = new Map<number, string>();
            books.forEach(b => {
                if (b.bookId && b.title) booksMap.set(b.bookId, b.title);
                if (b.bookCopyId && b.title) copiesMap.set(b.bookCopyId, b.title);
            });
            setBookTitleMap(booksMap);
            setCopyTitleMap(copiesMap);
        } catch (error) {
            console.error('Failed to load member details', error);
            setLoadError(true);
        }
    }, []);

    useEffect(() => {
        if (member) void loadData(member.memberId);
    }, [member, loadData]);

    const handleToggleFreeze = async (newStatus: string) => {
        if (!member) return;
        try {
            const todayStr = toApiDate();
            await librarianService.updateFreezeStatus(member.memberId, newStatus, todayStr);

            const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            await activityService.addActivity({
                memberId: member.memberId,
                type: 'FREEZE_STATUS',
                affectedEntityId: member.memberId,
                librarianId: librarianUser.librarianId
            });
            setMember({ ...member, freezeStatus: newStatus as Member['freezeStatus'] });
            setFeedback({ kind: 'success', text: 'Membership status updated successfully.' });
        } catch (error: any) {
            console.error('Failed to update membership status', error);
            const errorMsg = error.response?.data || error.message || 'Unable to update membership status.';
            setFeedback({ kind: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Unable to update membership status.' });
        }
    };

    const isFrozen = member?.freezeStatus === 'FROZEN';

    const selectedBook = borrows.find(book => book.bookCopyId === selectedCopyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedReturnDate = selectedBook ? toLocalDate(selectedBook.returnDate) : null;
    const extensionWindowStart = selectedReturnDate ? new Date(selectedReturnDate) : null;
    if (extensionWindowStart) extensionWindowStart.setDate(extensionWindowStart.getDate() - 7);

    const extensionIneligibleReason = !selectedBook || !member
        ? 'Select a book above to check extension.'
        : isFrozen
            ? 'Membership is frozen.'
            : today > selectedReturnDate!
                ? 'Overdue books cannot be extended.'
                : today < extensionWindowStart!
                    ? 'Extendable 7 days before due date.'
                    : '';

    const handleExtend = async () => {
        if (!member || !selectedBook || extensionIneligibleReason) return;
        if (!window.confirm(`Extend "${selectedBook.title}" by two weeks?`)) return;

        setExtending(true);
        setFeedback(null);
        try {
            await borrowService.extendBorrow(member.memberId, selectedBook.bookCopyId);
            setSelectedCopyId(null);
            await loadData(member.memberId);
            setFeedback({ kind: 'success', text: `"${selectedBook.title}" was extended by two weeks.` });

            try {
                const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                await activityService.addActivity({
                    memberId: member.memberId,
                    type: 'EXTEND',
                    affectedEntityId: selectedBook.bookId,
                    librarianId: librarianUser.librarianId
                });
            } catch (error) {
                console.error('Activity logging failed', error);
            }
        } catch (error) {
            setFeedback({ kind: 'error', text: 'Extension was not approved.' });
        } finally {
            setExtending(false);
        }
    };

    const formatActivityDescription = useCallback((activity: Activity) => {
        const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG['DEFAULT'];
        const entityId = activity.affectedEntityId;
        const isOrderActivity = activity.type === 'ORDER' || activity.type === 'CANCEL_ORDER';

        const resolvedTitle = isOrderActivity
            ? bookTitleMap.get(entityId)
            : (copyTitleMap.get(entityId) ?? bookTitleMap.get(entityId));
        
        const title = resolvedTitle || (entityId ? `Book #${entityId}` : '');
        return config.formatDescription(title);
    }, [bookTitleMap, copyTitleMap]);

    const activityColumns = useMemo<DataTableColumn<Activity>[]>(() => [
        {
            key: 'type',
            header: 'Activity Type',
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
            cellClassName: 'w-[45%] font-medium text-primary',
            render: activity => formatActivityDescription(activity),
        },
        {
            key: 'date-time',
            header: 'Date & Time',
            headerClassName: 'w-[30%]',
            cellClassName: 'w-[30%] text-muted text-sm',
            render: activity => new Intl.DateTimeFormat(navigator.language, { 
                dateStyle: 'medium', timeStyle: 'short' 
            }).format(new Date(activity.activityDateTime)),
        },
    ], [formatActivityDescription]);

    const filteredBorrows = borrows.filter(book => book.title.toLowerCase().includes(filterQuery.toLowerCase()));

    if (!member) {
        return (
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
                <p className="text-sm text-muted">No member selected. Open a member record from the member directory.</p>
            </div>
        );
    }

    const btnClass = "inline-flex min-h-11 items-center justify-center border border-accent-border bg-surface px-4 py-2 text-sm font-semibold text-accent-text transition-colors can-hover:bg-accent-solid can-hover:text-inverse focus:outline-none focus:ring-2 focus:ring-accent-border disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 font-sans text-primary sm:px-8 sm:py-10">
            <header className="border-b border-border-subtle pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Management</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Member Profile & Borrowing</h1>
            </header>

            {loadError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load member details.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void loadData(member.memberId)}>
                        Retry
                    </button>
                </div>
            )}

            {feedback && (
                <p
                    className={`border-s-4 px-4 py-3 text-sm ${
                        feedback.kind === 'success'
                            ? 'border-success-dark bg-success-subtle text-primary'
                            : 'border-danger-border bg-danger-subtle text-danger-text'
                    }`}
                    role={feedback.kind === 'error' ? 'alert' : 'status'}
                >
                    {feedback.text}
                </p>
            )}

            {/* Top Portion: Symmetric 2-Column Grid for Member Details & Borrowed Books */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Column: Member Details & Status Control */}
                <div className="lg:col-span-4 flex flex-col">
                    <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-sm space-y-5 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3.5 border-b border-border-subtle pb-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-text font-bold text-lg">
                                    {member.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-primary truncate">{member.fullName}</h2>
                                    <p className="text-xs text-secondary">ID: {member.memberId}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mt-5">
                                <FormField
                                    label="Email address"
                                    value={member.email}
                                    readOnly
                                    labelClassName="text-xs font-semibold text-secondary"
                                />
                                <FormField
                                    label="Phone number"
                                    value={member.phoneNum || 'Not listed'}
                                    readOnly
                                    labelClassName="text-xs font-semibold text-secondary"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-subtle space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-secondary">Membership Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-block h-2 w-2 rounded-full ${isFrozen ? 'bg-danger-border animate-pulse' : 'bg-success-dark'}`} />
                                    <span className={`text-xs font-semibold ${isFrozen ? 'text-danger-text' : 'text-success-dark'}`}>
                                        {isFrozen ? 'Frozen & Suspended' : 'Active & Eligible'}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-1">
                                {isFrozen ? (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        fullWidth
                                        onClick={() => void handleToggleFreeze('NOT_FROZEN')}
                                    >
                                        Activate Membership
                                    </Button>
                                ) : (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        fullWidth
                                        onClick={() => void handleToggleFreeze('FROZEN')}
                                    >
                                        Freeze Membership
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Borrowed Books & Extension Manager */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm space-y-4 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-primary">Borrowed Books ({borrows.length})</h2>
                                    <p className="text-xs text-muted mt-0.5">Select a book card to execute a borrow extension.</p>
                                </div>
                                <input
                                    className="w-full sm:w-56 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-primary outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border"
                                    placeholder="Filter borrows..."
                                    value={filterQuery}
                                    onChange={event => setFilterQuery(event.target.value)}
                                />
                            </div>

                            {filteredBorrows.length === 0 ? (
                                <div className="rounded-xl border border-border-subtle bg-surface-soft p-12 text-center text-muted text-sm my-4">
                                    {borrows.length ? 'No borrowed books match this filter.' : 'No active borrowed books for this member.'}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1 my-4">
                                    {filteredBorrows.map(book => {
                                        const isSelected = selectedCopyId === book.bookCopyId;
                                        const isOverdue = today > toLocalDate(book.returnDate);
                                        return (
                                            <div
                                                key={book.bookCopyId}
                                                onClick={() => setSelectedCopyId(book.bookCopyId)}
                                                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3.5 transition-all ${
                                                    isSelected
                                                        ? 'border-accent-border bg-accent-subtle shadow-sm'
                                                        : 'border-border-subtle bg-surface hover:border-accent-border'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="borrowed-book-selection"
                                                    checked={isSelected}
                                                    onChange={() => setSelectedCopyId(book.bookCopyId)}
                                                    className="h-4 w-4 accent-accent-solid"
                                                />
                                                <img
                                                    src={`/images/covers/${book.bookId}.jpg`}
                                                    alt={book.title}
                                                    onError={e => { e.currentTarget.src = '/images/book_logo.png'; }}
                                                    className="h-14 w-10 shrink-0 rounded object-cover shadow-sm"
                                                />
                                                <div className="flex flex-1 flex-col justify-center min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-primary">{book.title}</h3>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                                                        <span>Borrowed: {formatDate(book.borrowDate)}</span>
                                                        <span>•</span>
                                                        <span className={isOverdue ? 'font-semibold text-danger-text' : ''}>
                                                            Due: {formatDate(book.returnDate)} {isOverdue ? '· Overdue' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-subtle">
                            <p className={`text-xs ${extensionIneligibleReason ? 'text-muted' : 'text-success-dark'}`} role="status">
                                {extensionIneligibleReason || 'Selected book is eligible for a 2-week extension.'}
                            </p>
                            <button
                                type="button"
                                className={btnClass}
                                onClick={handleExtend}
                                disabled={!selectedBook || Boolean(extensionIneligibleReason) || extending}
                            >
                                {extending ? 'Extending...' : 'Extend selected book'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Portion: Member Activity Section stretching full width across both columns */}
            <div className="w-full rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-primary">Member Activity</h2>
                    <p className="text-xs text-muted mt-0.5">A record of past system actions associated with this member.</p>
                </div>

                <DataTable
                    columns={activityColumns}
                    rows={activities}
                    getRowKey={activity => `${activity.memberId}-${activity.activityDateTime}-${activity.type}-${activity.affectedEntityId}`}
                    tableClassName="table-fixed"
                    emptyMessage="No activities found for this member."
                />
            </div>
        </div>
    );
};

export default ViewMember;
