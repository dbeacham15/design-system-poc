import React from 'react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  byline?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<AlertProps['variant']>, React.CSSProperties> = {
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

const sizeStyles: Record<NonNullable<AlertProps['size']>, React.CSSProperties> = {
  sm: {
    padding: '8px 12px',
    fontSize: '13px',
  },
  md: {
    padding: '12px 16px',
    fontSize: '15px',
  },
  lg: {
    padding: '16px 20px',
    fontSize: '17px',
  },
};

export function Alert({
  variant = 'info',
  size = 'md',
  title = 'Alert',
  byline = 'This is a secondary line of supporting text.',
  icon,
  onClose,
  fullWidth = false,
}: AlertProps): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    border: '1px solid',
    borderRadius: '6px',
    width: fullWidth ? '100%' : 'fit-content',
    boxSizing: 'border-box',
    position: 'relative',
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    marginBottom: byline ? '4px' : '0',
  };

  const bylineStyle: React.CSSProperties = {
    margin: 0,
    opacity: 0.85,
    fontSize: '0.9em',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    fontSize: '16px',
    lineHeight: 1,
    padding: '0 0 0 8px',
    marginLeft: 'auto',
    alignSelf: 'flex-start',
    opacity: 0.7,
  };

  const iconWrapperStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
  };

  return (
    <div
      role="alert"
      data-variant={variant}
      data-size={size}
      style={containerStyle}
    >
      {icon && (
        <span style={iconWrapperStyle} aria-hidden="true" data-testid="alert-icon">
          {icon}
        </span>
      )}
      <div style={contentStyle}>
        <div style={titleStyle} data-testid="alert-title">
          {title}
        </div>
        {byline && (
          <p style={bylineStyle} data-testid="alert-byline">
            {byline}
          </p>
        )}
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
