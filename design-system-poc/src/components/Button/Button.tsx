import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '1em',
  height: '1em',
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  borderRadius: 'var(--radius-full)',
  animation: 'button-spin 0.7s linear infinite',
};

const spinnerKeyframes = `
@keyframes button-spin {
  to { transform: rotate(360deg); }
}
`;

function getVariantStyles(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: 'var(--color-interactive)',
        color: 'var(--color-text-on-interactive)',
        border: '1px solid transparent',
      };
    case 'secondary':
      return {
        backgroundColor: 'var(--color-surface-raised)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: 'var(--color-text-primary)',
        border: '1px solid transparent',
      };
    case 'destructive':
      return {
        backgroundColor: 'var(--color-status-error)',
        color: 'var(--color-text-on-interactive)',
        border: '1px solid transparent',
      };
  }
}

function getSizeStyles(size: ButtonSize, isIconOnly: boolean): React.CSSProperties {
  switch (size) {
    case 'sm':
      return {
        fontSize: 'var(--font-size-sm)',
        padding: isIconOnly ? 'var(--space-xs)' : 'var(--space-xs) var(--space-sm)',
        gap: 'var(--space-xs)',
      };
    case 'md':
      return {
        fontSize: 'var(--font-size-md)',
        padding: isIconOnly ? 'var(--space-sm)' : 'var(--space-sm) var(--space-md)',
        gap: 'var(--space-xs)',
      };
    case 'lg':
      return {
        fontSize: 'var(--font-size-lg)',
        padding: isIconOnly ? 'var(--space-md)' : 'var(--space-md) var(--space-lg)',
        gap: 'var(--space-sm)',
      };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  iconOnly,
  onClick,
  type = 'button',
  fullWidth = false,
  children,
}: ButtonProps): React.ReactElement {
  const isIconOnly = Boolean(iconOnly);
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-medium)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--line-height-tight)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    pointerEvents: isDisabled ? 'none' : 'auto',
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    transition: 'background-color 0.15s ease, opacity 0.15s ease, border-color 0.15s ease',
    outline: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    position: 'relative',
    boxSizing: 'border-box',
    ...getVariantStyles(variant),
    ...getSizeStyles(size, isIconOnly),
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) return;
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--color-interactive-hover)';
    } else if (variant === 'secondary') {
      e.currentTarget.style.backgroundColor = 'var(--color-surface-overlay)';
    } else if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = 'var(--color-surface-overlay)';
    } else if (variant === 'destructive') {
      e.currentTarget.style.backgroundColor = 'var(--color-interactive-hover)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) return;
    const vs = getVariantStyles(variant);
    e.currentTarget.style.backgroundColor = (vs.backgroundColor as string) ?? '';
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) return;
    e.currentTarget.style.backgroundColor = 'var(--color-interactive-active)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) return;
    if (variant === 'primary' || variant === 'destructive') {
      e.currentTarget.style.backgroundColor = 'var(--color-interactive-hover)';
    } else {
      e.currentTarget.style.backgroundColor = 'var(--color-surface-overlay)';
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.outline = '2px solid var(--color-border-focus)';
    e.currentTarget.style.outlineOffset = '2px';
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.outline = 'none';
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <button
        data-variant={variant}
        data-size={size}
        data-loading={loading ? 'true' : undefined}
        data-icon-only={isIconOnly ? 'true' : undefined}
        type={type}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        style={baseStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-disabled={isDisabled}
        aria-busy={loading}
      >
        {loading ? (
          <span data-testid='button-spinner' style={spinnerStyle} aria-hidden='true' />
        ) : isIconOnly ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {iconOnly}
          </span>
        ) : (
          <>
            {leftIcon && (
              <span data-testid='button-left-icon' style={{ display: 'inline-flex', alignItems: 'center' }}>
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span data-testid='button-right-icon' style={{ display: 'inline-flex', alignItems: 'center' }}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
