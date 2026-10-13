import React from 'react';

export interface DropdownOptionProps {
    label: string;
    description?: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
}

export const DropdownOption: React.FC<DropdownOptionProps> = ({
    label,
    description,
    icon,
    isActive = false,
    onClick,
    className = '',
}) => {
    return (
        <button
            type="button"
            role="menuitem"
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors ${
                isActive
                    ? 'bg-accent-subtle font-semibold text-primary'
                    : 'text-secondary can-hover:bg-surface-soft can-hover:text-primary'
            } ${className}`}
            onClick={onClick}
        >
            {icon && (
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-surface-soft text-accent-text">
                    {icon}
                </span>
            )}
            <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold leading-tight text-primary">
                    {label}
                </span>
                {description && (
                    <span className="mt-0.5 text-xs font-normal leading-snug text-muted">
                        {description}
                    </span>
                )}
            </span>
        </button>
    );
};

export default DropdownOption;
