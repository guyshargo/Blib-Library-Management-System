import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import type { Member } from '../../types';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

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
        member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCardClick = (member: Member) => {
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 font-sans sm:px-8 sm:py-10">
            <header className="border-b border-border-subtle pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Management</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Member Directory</h1>
                </div>
                <Button 
                    variant="primary"
                    size="lg"
                    onClick={handleScanCard}
                >
                    Scan Reader Card
                </Button>
            </header>

            {loadError && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>Unable to load members. Check your connection and try again.</p>
                    <Button variant="danger" size="sm" onClick={() => void loadMembers()}>
                        Retry
                    </Button>
                </div>
            )}

            <div className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm">
                <div className="max-w-md">
                    <FormField 
                        label="Search members"
                        placeholder="Search by name, ID or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        labelClassName="text-sm font-semibold text-secondary"
                    />
                </div>

                {loading ? (
                    <div className="py-12 text-center text-sm text-muted">Loading members…</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="rounded-xl border border-border-subtle bg-surface-soft p-12 text-center text-muted">
                        {members.length === 0 ? 'No members are registered yet.' : 'No members match this search.'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMembers.map(member => {
                            const isFrozen = member.freezeStatus === 'FROZEN';
                            return (
                                <div
                                    key={member.memberId}
                                    onClick={() => handleCardClick(member)}
                                    className="group relative flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-5 shadow-sm transition-all duration-150 can-hover:hover:border-accent-border can-hover:hover:shadow-md can-hover:cursor-pointer"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-text font-bold text-sm">
                                                {member.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                isFrozen ? 'bg-danger-subtle text-danger-text' : 'bg-success-subtle text-success-dark'
                                            }`}>
                                                {member.freezeStatus}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-base font-semibold text-primary group-hover:text-accent-text transition-colors">
                                            {member.fullName}
                                        </h3>
                                        <p className="mt-1 text-xs text-secondary">ID: {member.memberId}</p>
                                        <p className="mt-0.5 text-xs text-muted truncate">{member.email}</p>
                                    </div>
                                    <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-semibold text-accent-text">
                                        <span>View profile & activity</span>
                                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageMember;
