import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showArrow?: boolean;
  maxWidth?: string;
  disabled?: boolean;
}

const sizeStyles: Record<NonNullable<TooltipProps['size']>, React.CSSProperties> = {
  sm: { fontSize: '11px', padding: '4px 8px' },
  md: { fontSize: '13px', padding: '6px 10px' },
  lg: { fontSize: '15px', padding: '8px 14px' },
};

const variantStyles: Record<NonNullable<TooltipProps['variant']>, React.CSSProperties> = {
  dark: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
  },
  light: {
    backgroundColor: '#ffffff',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
};

function getPlacementStyles(
  placement: NonNullable<TooltipProps['placement']>
): React.CSSProperties {
  switch (placement) {
    case 'top':
      return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
    case 'bottom':
      return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
    case 'left':
      return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
    case 'right':
      return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
  }
}

function getArrowStyles(
  placement: NonNullable<TooltipProps['placement']>,
  variant: NonNullable<TooltipProps['variant']>
): React.CSSProperties {
  const arrowColor = variant === 'dark' ? '#1f2937' : '#ffffff';
  const borderColor = variant === 'light' ? '#e5e7eb' : 'transparent';
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };
  switch (placement) {
    case 'top':
      return {
        ...base,
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '6px 6px 0 6px',
        borderColor: `${arrowColor} transparent transparent transparent`,
      };
    case 'bottom':
      return {
        ...base,
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 6px 6px 6px',
        borderColor: `transparent transparent ${arrowColor} transparent`,
      };
    case 'left':
      return {
        ...base,
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '6px 0 6px 6px',
        borderColor: `transparent transparent transparent ${arrowColor}`,
      };
    case 'right':
      return {
        ...base,
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '6px 6px 6px 0',
        borderColor: `transparent ${arrowColor} transparent transparent`,
      };
  }
}

export function Tooltip({
  content,
  children,
  variant = 'dark',
  size = 'md',
  placement = 'top',
  showArrow = true,
  maxWidth = '200px',
  disabled = false,
}: TooltipProps): React.ReactElement {
  const [visible, setVisible] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((): void => {
    if (disabled) return;
    timerRef.current = setTimeout(() => setVisible(true), 100);
  }, [disabled]);

  const hide = useCallback((): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    cursor: disabled ? 'not-allowed' : 'default',
  };

  const tooltipBoxStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9999,
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    maxWidth,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    pointerEvents: 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...getPlacementStyles(placement),
  };

  return (
    <div
      data-variant={variant}
      data-placement={placement}
      data-size={size}
      data-disabled={disabled}
      data-testid="tooltip-wrapper"
      style={wrapperStyle}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && !disabled && (
        <div
          role="tooltip"
          aria-label={content}
          data-testid="tooltip-box"
          style={tooltipBoxStyle}
        >
          {content}
          {showArrow && (
            <span
              data-testid="tooltip-arrow"
              aria-hidden="true"
              style={getArrowStyles(placement, variant)}
            />
          )}
        </div>
      )}
    </div>
  );
}
