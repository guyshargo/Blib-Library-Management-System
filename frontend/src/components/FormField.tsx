import React from 'react';

interface FormFieldProps {
    label: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    readOnly?: boolean;
    inputClassName?: string;
    containerClassName?: string;
    labelClassName?: string;
    actionButton?: React.ReactNode;
    id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    readOnly = false,
    inputClassName = '',
    containerClassName = '',
    labelClassName = '',
    actionButton,
    id,
}) => {
    const defaultInputClass = readOnly
        ? "min-w-0 rounded-md border border-border bg-surface-soft px-3.5 py-3 text-base text-secondary outline-none sm:text-sm"
        : "min-w-0 rounded-md border border-border px-3.5 py-3 text-base outline-none focus:border-accent-border focus:ring-2 focus:ring-accent-wash sm:text-sm";

    return (
        <div className={`flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:gap-5 ${containerClassName}`}>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label htmlFor={id} className={`text-base font-bold text-primary ${labelClassName}`}>
                    {label}
                </label>
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={`${defaultInputClass} ${inputClassName}`}
                />
            </div>
            {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>
    );
};

export default FormField;
