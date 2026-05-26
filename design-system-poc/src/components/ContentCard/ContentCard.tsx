import React from 'react';

export interface ContentCardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  badge?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeTokens = {
  sm: {
    padding: 'var(--space-sm)',
    titleFontSize: 'var(--font-size-md)',
    descFontSize: 'var(--font-size-sm)',
    imageHeight: '120px',
    gap: 'var(--space-xs)',
  },
  md: {
    padding: 'var(--space-md)',
    titleFontSize: 'var(--font-size-lg)',
    descFontSize: 'var(--font-size-md)',
    imageHeight: '180px',
    gap: 'var(--space-sm)',
  },
  lg: {
    padding: 'var(--space-lg)',
    titleFontSize: 'var(--font-size-xl)',
    descFontSize: 'var(--font-size-md)',
    imageHeight: '240px',
    gap: 'var(--space-md)',
  },
};

const spinnerKeyframes = `
@keyframes contentcard-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'contentcard-spinner-style';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = spinnerKeyframes;
    document.head.appendChild(styleEl);
  }
}

export function ContentCard({
  variant = 'default',
  size = 'md',
  title,
  description,
  imageSrc,
  imageAlt,
  badge,
  icon,
  footer,
  onClick,
  href,
  disabled = false,
  loading = false,
  fullWidth = false,
}: ContentCardProps): React.ReactElement {
  const tokens = sizeTokens[size];

  const isInteractive = Boolean(onClick || href);

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'outlined':
        return {
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'none',
        };
      case 'elevated':
        return {
          background: 'var(--color-surface-raised)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        };
      default:
        return {
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          boxShadow: 'none',
        };
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    width: fullWidth ? '100%' : undefined,
    maxWidth: fullWidth ? '100%' : '360px',
    position: 'relative',
    boxSizing: 'border-box',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    cursor: isInteractive && !disabled ? 'pointer' : 'default',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
    outline: 'none',
    ...getVariantStyles(),
  };

  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.gap,
    padding: tokens.padding,
    flex: '1 1 auto',
  };

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: tokens.titleFontSize,
    fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--line-height-tight)',
    color: 'var(--color-text-primary)',
    flex: '1 1 auto',
  };

  const descStyle: React.CSSProperties = {
    margin: 0,
    fontSize: tokens.descFontSize,
    fontWeight: 'var(--font-weight-normal)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--line-height-normal)',
    color: 'var(--color-text-secondary)',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: tokens.imageHeight,
    objectFit: 'cover',
    display: 'block',
    flexShrink: 0,
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `var(--space-xs) var(--space-sm)`,
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)' as React.CSSProperties['fontWeight'],
    background: 'var(--color-interactive)',
    color: 'var(--color-text-on-interactive)',
    lineHeight: 'var(--line-height-tight)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const footerStyle: React.CSSProperties = {
    padding: `var(--space-sm) ${tokens.padding}`,
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    flexShrink: 0,
  };

  const spinnerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-surface-overlay)',
    zIndex: 1,
    borderRadius: 'var(--radius-md)',
  };

  const spinnerInnerStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-interactive)',
    borderRadius: 'var(--radius-full)',
    animation: 'contentcard-spin 0.7s linear infinite',
  };

  const iconStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  const cardContent = (
    <>
      {loading && (
        <div style={spinnerStyle} aria-label="Loading" role="status" data-testid="loading-spinner">
          <div style={spinnerInnerStyle} />
        </div>
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt ?? ''}
          style={imageStyle}
          aria-hidden={!imageAlt ? true : undefined}
        />
      )}

      <div style={bodyStyle}>
        <div style={titleRowStyle}>
          {icon && (
            <span style={iconStyle} aria-hidden="true" data-testid="card-icon">
              {icon}
            </span>
          )}
          <h3 style={titleStyle}>{title}</h3>
          {badge && (
            <span style={badgeStyle} data-testid="card-badge">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p style={descStyle}>{description}</p>
        )}
      </div>

      {footer && (
        <div style={footerStyle} data-testid="card-footer">
          {footer}
        </div>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        style={containerStyle}
        data-variant={variant}
        data-size={size}
        data-testid="content-card"
        aria-label={title}
        aria-disabled={disabled}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div
      style={containerStyle}
      data-variant={variant}
      data-size={size}
      data-testid="content-card"
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
    >
      {cardContent}
    </div>
  );
}

export default ContentCard;
