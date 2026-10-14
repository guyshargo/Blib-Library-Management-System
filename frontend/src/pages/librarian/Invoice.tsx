import React, { useEffect, useState, useMemo } from 'react';
import { invoiceService } from '../../services/invoiceService';
import type { InvoiceMessage } from '../../types';
import AlertBanner from '../../components/AlertBanner';
import Button from '../../components/Button';
import Tag from '../../components/Tag';

const Invoice: React.FC = () => {
    const [invoices, setInvoices] = useState<InvoiceMessage[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceMessage | null>(null);
    const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');
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
            if (data.length > 0 && !selectedInvoice) {
                const unread = data.find(i => i.isRead === 'NOT_READ');
                setSelectedInvoice(unread || data[0]);
            }
        } catch (error) {
            console.error("Failed to load invoices", error);
            setErrorMessage('Unable to load communication messages. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const getMsgId = (inv: InvoiceMessage) =>
        inv.msgId ?? (inv as unknown as { messageId?: number }).messageId;

    const handleSelectInvoice = async (invoice: InvoiceMessage) => {
        setSelectedInvoice(invoice);
        const id = getMsgId(invoice);

        if (invoice.isRead === 'NOT_READ' && id !== undefined) {
            try {
                await invoiceService.markAsRead(id);
                setInvoices(prev =>
                    prev.map(inv => (getMsgId(inv) === id ? { ...inv, isRead: 'READ' } : inv))
                );
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        }
    };

    const unreadCount = useMemo(() => invoices.filter(i => i.isRead === 'NOT_READ').length, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesTab = filterTab === 'all' || (filterTab === 'unread' && inv.isRead === 'NOT_READ');
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query || 
                (inv.subject?.toLowerCase().includes(query)) ||
                (inv.username?.toLowerCase().includes(query)) ||
                (inv.fullName?.toLowerCase().includes(query)) ||
                (inv.content?.toLowerCase().includes(query));
            return matchesTab && matchesSearch;
        });
    }, [invoices, filterTab, searchQuery]);

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 font-sans sm:px-6 lg:px-8 lg:py-8">
            {/* Innovative Bento Top Bar: Title & Quick Stats fused */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-8 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-text">Patron Comms Hub</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">Inquiries & Messages Studio</h1>
                </div>
                <div className="lg:col-span-4 flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadInvoices()}
                    >
                        ↻ Refresh
                    </Button>
                </div>
            </div>

            {errorMessage && (
                <AlertBanner message={errorMessage} type="error" />
            )}

            {/* Asymmetrical Bento Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Inbox Feed */}
                <div className="lg:col-span-4 flex flex-col rounded-3xl border border-border-subtle bg-surface shadow-sm overflow-hidden lg:sticky lg:top-6">
                    <div className="p-4 border-b border-border-subtle bg-surface-soft/60 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Tag
                                    label={`All (${invoices.length})`}
                                    variant={filterTab === 'all' ? 'accent' : 'character'}
                                    onClick={() => setFilterTab('all')}
                                />
                                <Tag
                                    label={`Unread (${unreadCount})`}
                                    variant={filterTab === 'unread' ? 'accent' : 'character'}
                                    onClick={() => setFilterTab('unread')}
                                />
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter messages..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-primary placeholder-muted outline-none focus:border-accent"
                        />
                    </div>

                    <div className="max-h-[calc(100dvh-280px)] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-xs text-secondary">Loading messages...</div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="p-8 text-center text-xs text-secondary">No messages found.</div>
                        ) : (
                            filteredInvoices.map((inv, idx) => {
                                const invId = getMsgId(inv);
                                const selectedId = selectedInvoice ? getMsgId(selectedInvoice) : undefined;
                                const isSelected = selectedId !== undefined && selectedId === invId;
                                const isUnread = inv.isRead === 'NOT_READ';
                                return (
                                    <div
                                        key={invId ?? idx}
                                        onClick={() => void handleSelectInvoice(inv)}
                                        className={`group relative flex cursor-pointer flex-col gap-1 p-3.5 border-b border-b-border-subtle transition-all ${
                                            isSelected 
                                                ? 'bg-accent-wash/60 border-l-8 border-l-border-strong' 
                                                : isUnread 
                                                  ? 'bg-surface hover:bg-surface-soft font-medium' 
                                                  : 'bg-surface hover:bg-surface-soft text-secondary'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs truncate ${isUnread ? 'font-bold text-primary' : 'font-semibold text-primary'}`}>
                                                {inv.fullName || inv.username}
                                            </span>
                                            <span className="text-[10px] text-muted">
                                                {new Intl.DateTimeFormat(navigator.language, { month: 'short', day: 'numeric' }).format(new Date(inv.date))}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate ${isUnread ? 'font-semibold text-primary' : 'text-secondary'}`}>
                                            {inv.subject}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: Active Message Canvas */}
                <div className="lg:col-span-8 flex flex-col rounded-3xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
                    {selectedInvoice ? (
                        <div className="flex flex-col">
                            {/* Canvas Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-soft/40">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-wash text-accent-text text-sm font-bold">
                                        {(selectedInvoice.fullName || selectedInvoice.username || 'P').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-primary">{selectedInvoice.fullName || selectedInvoice.username}</h2>
                                        <p className="text-[11px] text-secondary">@{selectedInvoice.username} • ID: #{selectedInvoice.msgId}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Canvas Body */}
                            <div className="p-6 sm:p-8 flex flex-col gap-6">
                                <div className="flex flex-col gap-1 border-b border-border-subtle pb-4">
                                    <h3 className="text-lg font-bold text-primary">{selectedInvoice.subject}</h3>
                                    <p className="text-[11px] text-muted">
                                        {new Intl.DateTimeFormat(navigator.language, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(selectedInvoice.date))}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border-subtle bg-surface-soft p-6">
                                    <p className="whitespace-pre-wrap text-sm text-primary leading-relaxed">
                                        {selectedInvoice.content || 'No content provided.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                                    <span className="text-[11px] text-muted">Secure Library Channel</span>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => alert(`Replying to ${selectedInvoice.username}...`)}
                                    >
                                        Reply ↗
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-16 text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-3xl">📬</span>
                            <h3 className="text-base font-bold text-primary">Select a Message</h3>
                            <p className="text-xs text-secondary">Choose an inquiry from the inbox list to inspect details.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Invoice;
