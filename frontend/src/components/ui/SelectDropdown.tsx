import React, { useEffect, useRef, useState } from 'react';

export interface SelectDropdownOption {
    value: string | number;
    label: string;
}

interface SelectDropdownProps {
    value: string | number;
    onChange: (value: string) => void;
    options: SelectDropdownOption[];
    placeholder?: string;
    icon?: React.ReactNode;
    ariaLabel?: string;
    disabled?: boolean;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon,
    ariaLabel,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => String(opt.value) === String(value));
    const displayText = selectedOption ? selectedOption.label : placeholder;

    const buttonClass = 'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-xs font-semibold text-primary shadow-sm transition-colors can-hover:bg-surface-soft can-hover:border-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={ariaLabel}
                disabled={disabled}
                className={buttonClass}
                onClick={() => !disabled && setIsOpen(open => !open)}
            >
                {icon && <span className="text-secondary">{icon}</span>}
                <span>{displayText}</span>
                <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path d="m5 7.5 5 5 5-5" />
                </svg>
            </button>

            {isOpen && !disabled && (
                <div
                    className="absolute start-0 top-full z-30 mt-1 max-h-60 w-28 overflow-y-auto rounded-xl border border-border-subtle bg-surface py-2 shadow-[0_8px_24px_rgba(var(--color-shadow),0.16)]"
                    role="menu"
                >
                    {options.length === 0 ? (
                        <div className="px-4 py-2 text-xs text-secondary">No options available</div>
                    ) : (
                        options.map(opt => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        onChange(String(opt.value));
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-accent/15 text-accent font-bold'
                                            : 'text-primary hover:bg-surface-soft'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default SelectDropdown;
