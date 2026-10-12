import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import { memberService } from '../../services/memberService';
import type { Member, BorrowedBook, Activity } from '../../types';

const formatActivityDate = (value: string) =>
    new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const ViewMember: React.FC = () => {
    const location = useLocation();
    const passedMember = location.state?.selectedMember as Member | undefined;

    const [member, setMember] = useState<Member | null>(passedMember ?? null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [borrows, setBorrows] = useState<BorrowedBook[]>([]);
    const [filterQuery, setFilterQuery] = useState('');
    const [loadError, setLoadError] = useState(false);

    const loadData = async (memberId: number) => {
        setLoadError(false);
        try {
            const [acts, books] = await Promise.all([
                memberService.getActivities(memberId),
                borrowService.getMemberBorrows(memberId),
            ]);
            setActivities(acts);
            setBorrows(books);
        } catch (error) {
            console.error('Failed to load member details', error);
            setLoadError(true);
        }
    };

    useEffect(() => {
        if (member) void loadData(member.memberId);
    }, [member]);

    const handleToggleFreeze = async (newStatus: string) => {
        if (!member) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            await librarianService.updateFreezeStatus(member.memberId, newStatus, today);
            await borrowService.addActivity({
                memberId: member.memberId,
                activityType: 'freezeStatus',
                entityId: member.memberId,
            });
            setMember({ ...member, freezeStatus: newStatus as Member['freezeStatus'] });
            alert('Membership status updated.');
        } catch (error) {
            console.error('Failed to update membership status', error);
            alert('Unable to update the membership status. Check your connection and try again.');
        }
    };

    const handleChangeReturnDate = async (book: BorrowedBook) => {
        if (!member) return;
        const newDate = window.prompt(
            `Enter a new return date for "${book.title}" in YYYY-MM-DD format:`,
            book.returnDate,
        );
        if (!newDate) return;

        try {
            const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            await librarianService.changeReturnDate({
                memberId: member.memberId,
                bookCopyId: book.bookCopyId,
                newReturnDate: newDate,
                librarianName: librarianUser.fullName || 'Librarian',
                librarianId: librarianUser.librarianId || 101,
                extensionDate: new Date().toISOString().split('T')[0],
            });
            alert('Return date updated.');
            void loadData(member.memberId);
        } catch (error) {
            console.error('Failed to update return date', error);
            alert('Unable to update the return date. Enter a valid date and try again.');
        }
    };

    const filteredBorrows = borrows.filter(book => book.title.toLowerCase().includes(filterQuery.toLowerCase()));

    if (!member) return <div className="p-6 text-sm text-muted">No member selected. Open a member record from the member list.</div>;

    return (
        <div className="flex min-h-screen flex-col gap-6 p-4 font-sans sm:p-6 lg:p-8">
            {loadError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load this member’s details. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void loadData(member.memberId)}>
                        Retry
                    </button>
                </div>
            )}

            <section className="grid grid-cols-1 items-end gap-4 rounded-lg bg-surface p-4 shadow-sm sm:grid-cols-2 sm:p-5 xl:grid-cols-4" aria-label="Member details">
                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-secondary">
                    Full name
                    <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-primary outline-none sm:text-sm" readOnly value={member.fullName} />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-secondary">
                    Email address
                    <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-primary outline-none sm:text-sm" readOnly value={member.email} />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-secondary">
                    Membership number
                    <input className="min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-primary outline-none sm:text-sm" readOnly value={member.memberId} />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-secondary">
                    Membership status
                    <select
                        className="min-w-0 rounded-md border border-border bg-surface px-3.5 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm"
                        value={member.freezeStatus}
                        onChange={event => void handleToggleFreeze(event.target.value)}
                    >
                        <option value="Frozen">Frozen</option>
                        <option value="Not Frozen">Not frozen</option>
                    </select>
                </label>
            </section>

            <section>
                <h2 className="mb-2 text-lg font-semibold text-primary">Activity</h2>
                <ul className="max-h-52 overflow-y-auto overscroll-contain rounded-lg bg-surface p-4 text-sm text-secondary">
                    {activities.length === 0 ? <li>No activity to show.</li> : activities.map((activity, index) => (
                        <li key={`${activity.activityDateTime}-${activity.type}-${index}`} className="mb-1">
                            {index + 1}. {formatActivityDate(activity.activityDateTime)} — {activity.type}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex flex-col gap-3">
                <label htmlFor="borrowed-book-filter" className="text-base font-semibold text-primary">Borrowed books</label>
                <input
                    id="borrowed-book-filter"
                    className="w-full max-w-md rounded-md border border-border bg-surface px-3.5 py-3 text-base text-primary outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm"
                    placeholder="e.g. The Hobbit"
                    value={filterQuery}
                    onChange={event => setFilterQuery(event.target.value)}
                />
                <div className="overflow-x-auto rounded-lg">
                    <table className="w-full min-w-[760px] border-collapse bg-surface text-sm font-semibold sm:text-base">
                        <thead>
                            <tr>
                                <th className="bg-table-header p-3 text-start">Book title</th>
                                <th className="bg-table-header p-3 text-start">Borrow date</th>
                                <th className="bg-table-header p-3 text-start">Return date (select to change)</th>
                                <th className="bg-table-header p-3 text-start">Librarian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBorrows.length === 0 ? (
                                <tr><td className="p-4 text-sm text-muted" colSpan={4}>{borrows.length ? 'No borrowed books match this search.' : 'No borrowed books to show.'}</td></tr>
                            ) : filteredBorrows.map(book => (
                                <tr key={book.bookCopyId} className="odd:bg-surface-soft even:bg-table-row-alt">
                                    <td className="border-b border-border-subtle p-3">{book.title}</td>
                                    <td className="border-b border-border-subtle p-3">{book.borrowDate}</td>
                                    <td className="border-b border-border-subtle p-3">
                                        <button type="button" className="text-start text-accent-text underline underline-offset-4 can-hover:text-accent-text-hover" onClick={() => void handleChangeReturnDate(book)}>
                                            {book.returnDate}
                                        </button>
                                    </td>
                                    <td className="border-b border-border-subtle p-3">{book.librarianName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default ViewMember;
