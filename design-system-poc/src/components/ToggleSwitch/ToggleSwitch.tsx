import React, { CSSProperties } from 'react';

export type ToggleSwitchSize = 'sm' | 'md' | 'lg';
export type ToggleSwitchVariant = 'primary' | 'success' | 'danger';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: ToggleSwitchSize;
  variant?: ToggleSwitchVariant;
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeConfig: Record<ToggleSwitchSize, { trackWidth: string; trackHeight: string; thumbSize: string; thumbOffset: string; spinnerSize: string }> = {
  sm: { trackWidth: '28px', trackHeight: '16px', thumbSize: '12px', thumbOffset: '2px', spinnerSize: '10px' },
  md: { trackWidth: '44px', trackHeight: '24px', thumbSize: '18px', thumbOffset: '3px', spinnerSize: '14px' },
  lg: { trackWidth: '56px', trackHeight: '32px', thumbSize: '24px', thumbOffset: '4px', spinnerSize: '18px' },
};

const variantColorMap: Record<ToggleSwitchVariant, string> = {
  primary: 'var(--color-interactive)',
  success: 'var(--color-status-success)',
  danger: 'var(--color-status-error)',
};

const variantHoverMap: Record<ToggleSwitchVariant, string> = {
  primary: 'var(--color-interactive-hover)',
  success: 'var(--color-status-success)',
  danger: 'var(--color-status-error)',
};

export function ToggleSwitch({
  checked,
  onChange,
  size = 'md',
  variant = 'primary',
  label,
  labelPosition = 'right',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ToggleSwitchProps): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const config = sizeConfig[size];
  const isInteractive = !disabled && !loading;

  const trackColor = checked
    ? hovered && isInteractive
      ? variantHoverMap[variant]
      : variantColorMap[variant]
    : 'var(--color-border)';

  const thumbTranslateX = checked
    ? `calc(${config.trackWidth} - ${config.thumbSize} - ${config.thumbOffset} * 2)`
    : '0px';

  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
    gap: 'var(--space-sm)',
    width: fullWidth ? '100%' : undefined,
    justifyContent: fullWidth ? 'space-between' : undefined,
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    cursor: loading ? 'wait' : isInteractive ? 'pointer' : 'default',
    userSelect: 'none',
  };

  const trackStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    width: config.trackWidth,
    height: config.trackHeight,
    borderRadius: 'var(--radius-full)',
    backgroundColor: trackColor,
    transition: 'background-color 0.2s ease',
    outline: focused ? `2px solid var(--color-border-focus)` : 'none',
    outlineOffset: '2px',
    boxSizing: 'border-box',
  };

  const thumbStyle: CSSProperties = {
    position: 'absolute',
    left: config.thumbOffset,
    width: config.thumbSize,
    height: config.thumbSize,
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-surface)',
    transform: `translateX(${thumbTranslateX})`,
    transition: 'transform 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  };

  const spinnerStyle: CSSProperties = {
    width: config.spinnerSize,
    height: config.spinnerSize,
    border: `2px solid transparent`,
    borderTopColor: variantColorMap[variant],
    borderRadius: 'var(--radius-full)',
    animation: 'toggleswitch-spin 0.7s linear infinite',
  };

  const labelFontSizeMap: Record<ToggleSwitchSize, string> = {
    sm: 'var(--font-size-xs)',
    md: 'var(--font-size-sm)',
    lg: 'var(--font-size-md)',
  };

  const labelStyle: CSSProperties = {
    fontSize: labelFontSizeMap[size],
    fontWeight: 'var(--font-weight-medium)' as CSSProperties['fontWeight'],
    lineHeight: 'var(--line-height-normal)',
    color: disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
  };

  const handleClick = (): void => {
    if (isInteractive) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (isInteractive && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <>
      <style>{`
        @keyframes toggleswitch-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        data-variant={variant}
        data-size={size}
        data-checked={checked}
        data-disabled={disabled || undefined}
        data-loading={loading || undefined}
        style={wrapperStyle}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-disabled={disabled || loading || undefined}
        tabIndex={isInteractive ? 0 : -1}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <div style={trackStyle}>
          <div style={thumbStyle}>
            {loading && <div data-testid="toggle-spinner" style={spinnerStyle} />}
          </div>
        </div>
        {label && (
          <span style={labelStyle}>
            {label}
          </span>
        )}
      </div>
    </>
  );
}
