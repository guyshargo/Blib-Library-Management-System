import React from 'react';

interface TagProps {
    label: string;
    variant?: 'character' | 'topic';
    icon?: React.ReactNode;
    onClick?: () => void;
}

export const Tag: React.FC<TagProps> = ({ label, variant = 'topic', icon, onClick }) => {
    const isCharacter = variant === 'character';

    const baseClasses = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors duration-150";
    const variantClasses = isCharacter
        ? "border-border-subtle bg-surface-soft text-secondary can-hover:border-accent-border can-hover:text-primary"
        : "border-border-subtle bg-surface text-muted can-hover:border-accent-border can-hover:text-primary";

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
