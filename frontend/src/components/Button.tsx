import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...props
}) => {
    const baseStyles = "inline-flex shrink-0 items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";

    const variantStyles = {
        primary: "bg-accent-solid text-inverse can-hover:bg-accent-solid-hover transition-opacity can-hover:opacity-90",
        secondary: "border border-accent-border bg-surface text-accent-text can-hover:bg-accent-wash",
        outline: "border border-border bg-surface text-primary can-hover:bg-surface-soft",
        danger: "border border-danger-border bg-danger-subtle text-danger-text can-hover:opacity-90",
    };

    const sizeStyles = {
        sm: "min-h-9 px-3 py-2 text-xs",
        md: "min-h-11 px-4 py-2.5 text-sm",
        lg: "min-h-12 px-6 py-3.5 text-base",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            type={type}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
