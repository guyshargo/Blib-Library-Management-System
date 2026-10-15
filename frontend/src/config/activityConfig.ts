import type { ActivityType } from '../types/enums';
import type { TagVariant } from '../components/ui/Tag';

export interface ActivityUIConfig {
    variant: TagVariant;
    label: string;
    formatDescription: (title: string) => string;
}

// Maps the strict backend enum strings to your frontend Tag UI
export const ACTIVITY_CONFIG: Record<ActivityType, ActivityUIConfig> = {
    'BORROW': { variant: 'info', label: 'Borrow', formatDescription: t => t ? `Borrowed "${t}"` : 'Borrowed book' },
    'RETURN': { variant: 'success', label: 'Return', formatDescription: t => t ? `Returned "${t}"` : 'Returned book' },
    'LATE_BOOK_RETURN': { variant: 'danger', label: 'Late Return', formatDescription: t => t ? `Returned "${t}" late` : 'Returned book late' },
    'EXTEND': { variant: 'accent', label: 'Extension', formatDescription: t => t ? `Extended borrow period for "${t}"` : 'Extended book borrow' },
    'ORDER': { variant: 'warning', label: 'Order', formatDescription: t => t ? `Ordered "${t}"` : 'Ordered book' },
    'CANCEL_ORDER': { variant: 'danger', label: 'Cancelled Order', formatDescription: t => t ? `Cancelled order for "${t}"` : 'Cancelled book order' },
    'REGISTRATION': { variant: 'topic', label: 'Registration', formatDescription: () => 'Completed account registration' },
    'FREEZE_STATUS': { variant: 'danger', label: 'Account Status', formatDescription: () => 'Membership status updated' },
    'DEFAULT': { variant: 'topic', label: 'Activity', formatDescription: t => t ? `Activity: "${t}"` : 'System activity' }
};