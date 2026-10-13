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
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 font-sans sm:px-8 sm:py-10">
            <header className="border-b border-border-subtle pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-text">Management</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Invoice & Communication Messages</h1>
            </header>

            {errorMessage && (
                <AlertBanner message={errorMessage} type="error" />
            )}

            <div className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-primary">Messages Inbox</h2>
                    <div className="flex items-center gap-2.5">
                        <input 
                            type="checkbox" 
                            id="unreadFilter"
                            checked={showUnreadOnly} 
                            onChange={e => setShowUnreadOnly(e.target.checked)} 
                            className="w-4 h-4 cursor-pointer rounded border-border"
                        />
                        <label htmlFor="unreadFilter" className="text-sm font-semibold text-primary cursor-pointer">Show unread only</label>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border-subtle">
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
                </div>
            </div>

            {selectedInvoice && (
                <section className="flex flex-col gap-6 rounded-2xl border border-accent-border bg-surface p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-primary">Message Details</h2>
                        <button 
                            type="button" 
                            className="text-xs font-semibold text-muted hover:text-primary underline underline-offset-2"
                            onClick={() => setSelectedInvoice(null)}
                        >
                            Close details
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <FormField
                            label="From"
                            value={selectedInvoice.fullName || selectedInvoice.username || ''}
                            readOnly
                            labelClassName="text-sm font-semibold text-secondary"
                            inputClassName="bg-surface-soft"
                        />
                        <FormField
                            label="Subject"
                            value={selectedInvoice.subject || ''}
                            readOnly
                            labelClassName="text-sm font-semibold text-secondary"
                            inputClassName="bg-surface-soft"
                        />
                        <FormField
                            label="Date"
                            value={new Intl.DateTimeFormat(navigator.language, { dateStyle: 'medium' }).format(new Date(selectedInvoice.date))}
                            readOnly
                            labelClassName="text-sm font-semibold text-secondary"
                            inputClassName="bg-surface-soft"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-secondary">Message Content</label>
                        <textarea 
                            readOnly 
                            className="min-h-[150px] w-full resize-none rounded-md border border-border-subtle bg-surface-soft p-4 text-base text-primary outline-none sm:text-sm"
                            value={selectedInvoice.content || ''}
                        />
                    </div>
                </section>
            )}
        </div>
    );
};

export default Invoice;
