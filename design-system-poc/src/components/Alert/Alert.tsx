import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type AlertSize = 'sm' | 'md' | 'lg';

export interface AlertProps {
  variant?: AlertVariant;
  size?: AlertSize;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  fullWidth?: boolean;
}

const variantStyles: Record<AlertVariant, React.CSSProperties> = {
  info: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
    color: '#0369a1',
  },
  success: {
    backgroundColor: '#dcfce7',
    borderColor: '#4ade80',
    color: '#15803d',
  },
  warning: {
    backgroundColor: '#fef9c3',
    borderColor: '#facc15',
    color: '#a16207',
  },
  error: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
    color: '#b91c1c',
  },
};

const sizeStyles: Record<AlertSize, React.CSSProperties> = {
  sm: { padding: '8px 12px', fontSize: '13px', borderRadius: '4px' },
  md: { padding: '12px 16px', fontSize: '15px', borderRadius: '6px' },
  lg: { padding: '16px 20px', fontSize: '17px', borderRadius: '8px' },
};

const titleSizeStyles: Record<AlertSize, React.CSSProperties> = {
  sm: { fontSize: '14px', marginBottom: '2px' },
  md: { fontSize: '16px', marginBottom: '4px' },
  lg: { fontSize: '18px', marginBottom: '6px' },
};

export function Alert({
  variant = 'info',
  size = 'md',
  title,
  children,
  icon,
  onClose,
  fullWidth = false,
}: AlertProps): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    border: '1px solid',
    width: fullWidth ? '100%' : 'fit-content',
    boxSizing: 'border-box',
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 700,
    margin: 0,
    ...titleSizeStyles[size],
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: 'inherit',
    fontSize: '18px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    flexShrink: 0,
  };

  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  };

  return (
    <div
      role="alert"
      data-variant={variant}
      data-size={size}
      style={containerStyle}
    >
      {icon && (
        <span style={iconStyle} aria-hidden="true" data-testid="alert-icon">
          {icon}
        </span>
      )}
      <div style={contentStyle}>
        {title && (
          <p style={titleStyle} data-testid="alert-title">
            {title}
          </p>
        )}
        <div data-testid="alert-body">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          style={closeButtonStyle}
          onClick={onClose}
          aria-label="Close alert"
          data-testid="alert-close"
        >
          &#x2715;
        </button>
      )}
    </div>
  );
}
