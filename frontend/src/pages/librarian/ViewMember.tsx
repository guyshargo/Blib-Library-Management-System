import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import { borrowService } from '../../services/borrowService';
import { memberService } from '../../services/memberService';
import type { Member, BorrowedBook, Activity } from '../../types';

const ViewMember: React.FC = () => {
    const location = useLocation();
    const passedMember = location.state?.selectedMember as Member;

    const [member, setMember] = useState<Member | null>(passedMember || null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [borrows, setBorrows] = useState<BorrowedBook[]>([]);
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
        if (member) {
            loadData(member.id);
        }
    }, [member]);

    const loadData = async (memberId: number) => {
        const [acts, books] = await Promise.all([
            memberService.getActivities(memberId),
            borrowService.getMemberBorrows(memberId)
        ]);
        setActivities(acts);
        setBorrows(books);
    };

    const handleToggleFreeze = async (newStatus: string) => {
        if (!member) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            await librarianService.updateFreezeStatus(member.id, newStatus, today);

            await borrowService.addActivity({
                membershipNumber: member.id,
                activityType: "freezeStatus",
                entityId: member.id
            });

            setMember({ ...member, freezeStatus: newStatus as any });
            alert("Updating status successful");
        } catch (error) {
            alert("Error in updating Status");
        }
    };

    const handleChangeReturnDate = async (book: BorrowedBook) => {
        if(!member) return;

        const newDate = window.prompt(`Enter the new return date for the book: ${book.title}\nFormat: YYYY-MM-DD`, book.returnDate);
        if (!newDate) return;

        try {
            const librarianUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

            const payload = {
                memberId: member.id,
                copyOfBookId: book.copyOfBookId,
                newReturnDate: newDate,
                librarianName: librarianUser.fullName || "Librarian",
                librarianId: librarianUser.librarianId || 101,
                extensionDate: new Date().toISOString().split('T')[0]
            };

            await librarianService.changeReturnDate(payload);
            alert("Return date changed successfully.");
            if (member) loadData(member.id);
        } catch (error) {
            alert("Invalid Date or Failed to update return date on server.");
        }
    };

    const filteredBorrows = borrows.filter(b => b.title.toLowerCase().includes(filterQuery.toLowerCase()));

    if (!member) return <div>No member selected.</div>;

    return (
        <div className="flex flex-col p-[30px] font-sans min-h-screen gap-5">
            <div className="flex items-end gap-5 bg-surface p-5 rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-primary">Full Name:</span>
                    <input className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px] bg-neutral text-secondary cursor-not-allowed" readOnly value={member.fullName} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-primary">Email Address:</span>
                    <input className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px] bg-neutral text-secondary cursor-not-allowed" readOnly value={member.email} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-primary">Membership Number:</span>
                    <input className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px] bg-neutral text-secondary cursor-not-allowed" readOnly value={member.id} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-base font-bold text-primary">Freeze Status:</span>
                    <select 
                        className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px] bg-surface"
                        value={member.freezeStatus} 
                        onChange={e => handleToggleFreeze(e.target.value)}
                    >
                        <option value="Frozen">Frozen</option>
                        <option value="Not Frozen">Not Frozen</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-5">
                <div className="flex-1">
                    <h3 className="text-base font-bold text-primary mb-2">Activities</h3>
                    <ul className="bg-surface p-5 rounded-[5px] max-h-[200px] overflow-y-auto">
                        {activities.length === 0 ? <li>No activities found.</li> : activities.map((act, i) => (
                            <li key={i} className="mb-1">{i + 1} {new Date(act.activityDateTime).toLocaleString()} - {act.type}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-base font-bold text-primary">Borrowed Books:</span>
                <input 
                    className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none min-w-[200px]"
                    placeholder="Enter Book's Title to Filter" 
                    value={filterQuery} 
                    onChange={e => setFilterQuery(e.target.value)} 
                />
            </div>

            <table className="w-full bg-surface rounded-[5px] border-collapse font-semibold mt-2.5">
                <thead>
                    <tr>
                        <th className="bg-table-header p-3 text-left">Book Title</th>
                        <th className="bg-table-header p-3 text-left">Borrow Date</th>
                        <th className="bg-table-header p-3 text-left">Return Date (Click to Extend)</th>
                        <th className="bg-table-header p-3 text-left">Librarian Name</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBorrows.map(book => (
                        <tr key={book.copyOfBookId} className="odd:bg-surface-soft even:bg-table-row-alt hover:bg-row-hover">
                            <td className="p-3 border-b border-border-subtle">{book.title}</td>
                            <td className="p-3 border-b border-border-subtle">{book.borrowDate}</td>
                            <td 
                                className="p-3 border-b border-border-subtle text-accent-text underline cursor-pointer hover:text-accent-text-hover"
                                onClick={() => handleChangeReturnDate(book)}
                            >
                                {book.returnDate}
                            </td>
                            <td className="p-3 border-b border-border-subtle">{book.librarianName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewMember;