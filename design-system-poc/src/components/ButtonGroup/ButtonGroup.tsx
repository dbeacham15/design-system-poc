import React from 'react';

export interface ButtonGroupOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface ButtonGroupProps {
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  options: ButtonGroupOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: '12px', height: '28px' },
  md: { padding: '6px 16px', fontSize: '14px', height: '36px' },
  lg: { padding: '10px 24px', fontSize: '16px', height: '44px' },
};

export function ButtonGroup({
  variant = 'outlined',
  size = 'md',
  options,
  value,
  onChange,
  disabled = false,
  fullWidth = false,
}: ButtonGroupProps): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    borderRadius: '6px',
    overflow: 'hidden',
    border: variant === 'outlined' ? '1px solid #c0c0c0' : 'none',
    boxSizing: 'border-box',
  };

  const getButtonStyle = (option: ButtonGroupOption, index: number): React.CSSProperties => {
    const isActive = option.value === value;
    const isLast = index === options.length - 1;
    const isFirst = index === 0;

    const base: React.CSSProperties = {
      ...sizeStyles[size],
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      flex: fullWidth ? 1 : undefined,
      boxSizing: 'border-box',
      transition: 'background-color 0.15s, color 0.15s',
      borderRadius: isFirst ? '5px 0 0 5px' : isLast ? '0 5px 5px 0' : '0',
      borderRight: !isLast && variant === 'outlined' ? '1px solid #c0c0c0' : undefined,
      fontFamily: 'inherit',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    };

    if (variant === 'filled') {
      return {
        ...base,
        backgroundColor: isActive ? '#2563eb' : '#e5e7eb',
        color: isActive ? '#ffffff' : '#374151',
      };
    }

    // outlined
    return {
      ...base,
      backgroundColor: isActive ? '#eff6ff' : '#ffffff',
      color: isActive ? '#2563eb' : '#374151',
    };
  };

  return (
    <div
      data-variant={variant}
      data-size={size}
      data-testid='button-group'
      style={containerStyle}
      role='group'
      aria-label='button group'
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type='button'
          data-value={option.value}
          data-active={option.value === value ? 'true' : 'false'}
          style={getButtonStyle(option, index)}
          onClick={() => onChange?.(option.value)}
          disabled={disabled}
          aria-pressed={option.value === value}
        >
          {option.icon && <span data-testid={`icon-${option.value}`}>{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default ButtonGroup;
