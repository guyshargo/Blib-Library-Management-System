import React from 'react';

interface AlertBannerProps {
    message: React.ReactNode;
    onRetry?: () => void;
    type?: 'error' | 'warning' | 'info' | 'success';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
    message,
    onRetry,
    type = 'error',
}) => {
    const typeClasses = {
        error: "border-l-4 border-danger-border bg-danger-subtle text-danger-text",
        warning: "border-l-4 border-warning-border bg-warning-subtle text-warning-text",
        info: "border-l-4 border-info-border bg-info-subtle text-info-text",
        success: "border-l-4 border-success-dark bg-success-subtle text-success-dark",
    };

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 p-4 ${typeClasses[type]}`} role="alert">
            <p className="font-medium">{message}</p>
            {onRetry && (
                <button
                    type="button"
                    className="rounded-md border border-current px-4 py-2 text-sm font-semibold transition-colors can-hover:bg-surface/20"
                    onClick={onRetry}
                >
                    Retry
                </button>
            )}
        </div>
    );
};

export default AlertBanner;
