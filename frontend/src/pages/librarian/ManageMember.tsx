import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import type { Member } from '../../types';

const ManageMember: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const navigate = useNavigate();

    const loadMembers = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const data = await librarianService.getAllMembers();
            setMembers(data);
        } catch (error) {
            console.error('Failed to load members', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMembers();
    }, [loadMembers]);

    const filteredMembers = members.filter(member => 
        member.memberId.toString().includes(searchQuery) || 
        member.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRowClick = (member: Member) => {
        navigate('/view-member', { state: { selectedMember: member } });
    };

    const handleScanCard = async () => {
        const barcode = window.prompt("Scan ReaderCard Barcode\nPlease enter the barcode to scan:");
        if (!barcode || !barcode.trim()) return;

        try {
            const member = await librarianService.getMemberByBarcode(barcode.trim());
            navigate('/view-member', { state: { selectedMember: member } });
        } catch (error) {
            alert("No member found with barcode.");
        }
    };

    return (
        <div className="flex min-h-screen flex-col gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <div className="flex flex-col items-stretch justify-center gap-3 bg-transparent p-2 sm:flex-row sm:items-center sm:gap-5">
                <label htmlFor="member-search" className="text-base font-bold text-primary">Search members</label>
                <input 
                    id="member-search"
                    className="w-full rounded-[5px] border border-border px-[15px] py-2.5 text-base outline-none sm:max-w-md sm:text-sm"
                    placeholder="e.g. Alex Morgan or 123456789"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {loadError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load members. Check your connection and try again.</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void loadMembers()}>
                        Retry
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse rounded-[5px] bg-surface font-semibold">
                <thead>
                    <tr>
                        <th className="bg-table-header p-3 text-left">Membership Number</th>
                        <th className="bg-table-header p-3 text-left">Name</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td className="p-4 text-sm text-muted" colSpan={2}>Loading members…</td></tr>
                    ) : filteredMembers.length === 0 ? (
                        <tr><td className="p-4 text-sm text-muted" colSpan={2}>{members.length === 0 ? 'No members are registered yet.' : 'No members match this search. Clear the search to see all members.'}</td></tr>
                    ) : filteredMembers.map(member => (
                        <tr key={member.memberId} onClick={() => handleRowClick(member)} className="odd:bg-surface-soft even:bg-table-row-alt can-hover:bg-row-hover can-hover:cursor-pointer">
                            <td className="p-3 border-b border-border-subtle">{member.memberId}</td>
                            <td className="p-3 border-b border-border-subtle">{member.fullName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            <div className="flex justify-center mt-5">
                <button 
                    className="rounded-md bg-accent-solid px-5 py-3 text-base font-semibold text-inverse transition-colors can-hover:bg-accent-solid-hover"
                    onClick={handleScanCard}
                >
                    Scan Reader Card
                </button>
            </div>
        </div>
    );
};

export default ManageMember;