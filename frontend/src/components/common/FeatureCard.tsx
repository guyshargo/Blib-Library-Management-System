import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    to?: string;
    onClick?: () => void;
    className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    icon,
    to,
    onClick,
    className = '',
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate(to);
        }
    };

    const isInteractive = Boolean(onClick || to);

    const content = (
        <>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-accent-text shadow-2xs">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold leading-snug text-primary">
                    {title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                    {description}
                </p>
            </div>
        </>
    );

    const baseClasses = `flex w-full items-start gap-4 rounded-xl border border-border-subtle bg-surface-soft/60 p-4 text-start ${className}`;

    if (isInteractive) {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`${baseClasses} transition-all can-hover:border-accent-border can-hover:bg-surface-soft can-hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border`}
            >
                {content}
            </button>
        );
    }

    return <div className={baseClasses}>{content}</div>;
};

export default FeatureCard;