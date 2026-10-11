import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import type { Member } from '../../types';

const ManageMember: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadMembers = async () => {
            try {
                const data = await librarianService.getAllMembers();
                setMembers(data);
            } catch (error) {
                console.error("No subscribers found");
            }
        };
        loadMembers();
    }, []);

    const filteredMembers = members.filter(member => 
        member.id.toString().includes(searchQuery) || 
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
        <div className="flex flex-col p-[30px] font-sans min-h-screen gap-5">
            <div className="flex items-end gap-5 p-5 justify-center bg-transparent">
                <span className="text-[20px] font-bold text-primary">Search members:</span>
                <input 
                    className="rounded-[5px] text-sm px-[15px] py-2.5 border border-border outline-none w-[400px]"
                    placeholder="Enter member name or membership number" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <table className="w-full bg-surface rounded-[5px] border-collapse font-semibold mt-2.5">
                <thead>
                    <tr>
                        <th className="bg-table-header p-3 text-left">Membership Number</th>
                        <th className="bg-table-header p-3 text-left">Name</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMembers.map(member => (
                        <tr key={member.id} onClick={() => handleRowClick(member)} className="odd:bg-surface-soft even:bg-table-row-alt hover:bg-row-hover hover:cursor-pointer">
                            <td className="p-3 border-b border-border-subtle">{member.id}</td>
                            <td className="p-3 border-b border-border-subtle">{member.fullName}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-center mt-5">
                <button 
                    className="bg-accent-subtle rounded-full text-primary text-base font-semibold border-2 border-transparent px-[25px] py-2.5 cursor-pointer transition-all duration-200 hover:bg-accent-subtle-hover hover:shadow-[inset_0_3px_8px_rgba(0,0,0,0.3)]"
                    onClick={handleScanCard}
                >
                    Scan Reader Card
                </button>
            </div>
        </div>
    );
};

export default ManageMember;