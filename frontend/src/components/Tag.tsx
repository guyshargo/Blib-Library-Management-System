import React from 'react';

export type TagVariant = 'character' | 'topic' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

interface TagProps {
    label: string;
    variant?: TagVariant;
    icon?: React.ReactNode;
    onClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({ label, variant = 'topic', icon, onClick }) => {
    const baseClasses = "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-150";
    
    const variantClasses = {
        character: "border-border-subtle bg-surface-soft text-secondary can-hover:border-accent-border can-hover:text-primary font-medium normal-case tracking-normal rounded-lg",
        topic: "border-border-subtle bg-surface text-muted can-hover:border-accent-border can-hover:text-primary font-medium normal-case tracking-normal rounded-lg",
        info: "border-info-border bg-info-subtle text-info-text",
        success: "border-success-dark bg-success-subtle text-success-dark",
        warning: "border-warning-border bg-warning-subtle text-warning-text",
        danger: "border-danger-border bg-danger-subtle text-danger-text",
        accent: "border-accent-border bg-accent-wash text-accent-text font-semibold normal-case tracking-normal rounded-lg",
    }[variant];

    const content = (
        <>
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="truncate">{label}</span>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${baseClasses} ${variantClasses} cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-1`}
            >
                {content}
            </button>
        );
    }

    return (
        <span className={`${baseClasses} ${variantClasses}`}>
            {content}
        </span>
    );
};

export default Tag;
