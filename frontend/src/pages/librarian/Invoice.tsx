import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services/invoiceService';
import type { InvoiceMessage } from '../../types';
import AlertBanner from '../../components/AlertBanner';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';

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

    const columns = [
        {
            key: 'subject',
            header: 'Subject',
            render: (inv: InvoiceMessage) => inv.subject,
        },
        {
            key: 'username',
            header: 'Username',
            render: (inv: InvoiceMessage) => inv.username,
        },
        {
            key: 'fullName',
            header: 'Name',
            render: (inv: InvoiceMessage) => inv.fullName || inv.username,
        },
        {
            key: 'date',
            header: 'Date',
            render: (inv: InvoiceMessage) => new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium' }).format(new Date(inv.date)),
        },
    ];

    return (
        <div className="flex min-h-screen flex-col gap-5 p-4 font-sans sm:p-6 lg:p-8">
            <h2 className="text-[23px] font-bold text-primary self-center">Invoice Messages</h2>

            {errorMessage && (
                <AlertBanner message={errorMessage} onRetry={() => void loadInvoices()} type="error" />
            )}

            <DataTable
                columns={columns}
                rows={displayedInvoices}
                getRowKey={inv => inv.msgId}
                loadingMessage={loading ? "Loading messages…" : undefined}
                emptyMessage={invoices.length === 0 ? 'No messages to show.' : 'No unread messages. Turn off the unread filter to view all messages.'}
                onRowClick={handleInvoiceClick}
                getRowClassName={(inv) => !inv.isRead ? 'bg-info-subtle can-hover:bg-info-border cursor-pointer' : 'odd:bg-surface-soft even:bg-table-row-alt can-hover:bg-row-hover cursor-pointer'}
                tableClassName="font-semibold"
            />

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
                <div className="flex-1">
                    <FormField
                        label="From:"
                        value={selectedInvoice?.fullName || ''}
                        readOnly
                        inputClassName="bg-neutral"
                    />
                </div>
                <div className="flex-1">
                    <FormField
                        label="Subject:"
                        value={selectedInvoice?.subject || ''}
                        readOnly
                        inputClassName="bg-neutral"
                    />
                </div>
                <div className="flex-1">
                    <FormField
                        label="Date:"
                        value={selectedInvoice ? new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium' }).format(new Date(selectedInvoice.date)) : ''}
                        readOnly
                        inputClassName="bg-neutral"
                    />
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