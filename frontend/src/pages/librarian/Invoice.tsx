import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services/invoiceService';
import type { InvoiceMessage } from '../../types';

const Invoice: React.FC = () => {
    const [invoices, setInvoices] = useState<InvoiceMessage[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceMessage | null>(null);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        void loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const data = await invoiceService.getInvoices();
            setInvoices(data);
        } catch (error) {
            console.error("Failed to load invoices", error);
            setErrorMessage('Unable to load messages. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInvoiceClick = async (invoice: InvoiceMessage) => {
        setSelectedInvoice(invoice);

        if (!invoice.isRead) {
            try {
                await invoiceService.markAsRead(invoice.msgId);
                await loadInvoices();
            } catch (error) {
                console.error("Failed to mark as read", error);
                setErrorMessage('Unable to mark this message as read. Try again.');
            }
        }
    };

    const displayedInvoices = showUnreadOnly 
        ? invoices.filter(inv => !inv.isRead) 
        : invoices;

    return (
        <div className="flex min-h-screen flex-col gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <h2 className="text-[23px] font-bold text-primary self-center">Invoice Messages</h2>

            {errorMessage && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-danger-border bg-danger-subtle p-4 text-danger-text" role="alert">
                    <p>{errorMessage}</p>
                    <button className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold" onClick={() => void loadInvoices()}>
                        Retry
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse rounded-[5px] bg-surface font-semibold">
                <thead>
                    <tr>
                        <th className="bg-table-header p-3 text-left">Subject</th>
                        <th className="bg-table-header p-3 text-left">Username</th>
                        <th className="bg-table-header p-3 text-left">Name</th>
                        <th className="bg-table-header p-3 text-left">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td className="p-4 text-sm text-muted" colSpan={4}>Loading messages…</td></tr>
                    ) : displayedInvoices.length === 0 ? (
                        <tr><td className="p-4 text-sm text-muted" colSpan={4}>{invoices.length === 0 ? 'No messages to show.' : 'No unread messages. Turn off the unread filter to view all messages.'}</td></tr>
                    ) : displayedInvoices.map(inv => (
                        <tr 
                            key={inv.msgId} 
                            onClick={() => handleInvoiceClick(inv)}
                            className={!inv.isRead ? 'bg-info-subtle can-hover:bg-info-border cursor-pointer' : 'odd:bg-surface-soft even:bg-table-row-alt can-hover:bg-row-hover cursor-pointer'}
                        >
                            <td className="p-3 border-b border-border-subtle">{inv.subject}</td>
                            <td className="p-3 border-b border-border-subtle">{inv.username}</td>
                            <td className="p-3 border-b border-border-subtle">{inv.fullName || inv.username}</td>
                            <td className="p-3 border-b border-border-subtle">{new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium' }).format(new Date(inv.date))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
                <span className="text-base font-bold text-primary">Show:</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="unreadFilter"
                        checked={showUnreadOnly} 
                        onChange={e => setShowUnreadOnly(e.target.checked)} 
                        className="w-[18px] h-[18px] cursor-pointer"
                    />
                    <label htmlFor="unreadFilter" className="text-base font-bold text-primary cursor-pointer">Unread Messages</label>
                </div>
            </div>

            <div className="flex flex-col items-stretch gap-4 bg-transparent sm:flex-row sm:items-end">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-bold text-primary">From:</span>
                    <input className="min-w-0 rounded-[5px] border border-border bg-neutral px-[15px] py-2.5 text-base text-secondary outline-none sm:text-sm" readOnly value={selectedInvoice?.fullName || ''} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-bold text-primary">Subject:</span>
                    <input className="min-w-0 rounded-[5px] border border-border bg-neutral px-[15px] py-2.5 text-base text-secondary outline-none sm:text-sm" readOnly value={selectedInvoice?.subject || ''} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-bold text-primary">Date:</span>
                    <input className="min-w-0 rounded-[5px] border border-border bg-neutral px-[15px] py-2.5 text-base text-secondary outline-none sm:text-sm" readOnly value={selectedInvoice ? new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium' }).format(new Date(selectedInvoice.date)) : ''} />
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-1">
                <textarea 
                    readOnly 
                    className="min-h-[150px] resize-none rounded-[5px] border border-border bg-neutral px-[15px] py-2.5 text-base text-secondary outline-none sm:text-lg"
                    value={selectedInvoice?.content || ''}
                />
            </div>
        </div>
    );
};

export default Invoice;