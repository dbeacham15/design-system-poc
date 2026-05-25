import React, { CSSProperties } from 'react';

export interface TextFieldProps {
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  error?: boolean;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: string;
}

const sizeMap: Record<'sm' | 'md' | 'lg', { padding: string; fontSize: string; height: string }> = {
  sm: { padding: '4px 8px', fontSize: '12px', height: '32px' },
  md: { padding: '8px 12px', fontSize: '14px', height: '40px' },
  lg: { padding: '12px 16px', fontSize: '16px', height: '48px' },
};

const spinnerStyle: CSSProperties = {
  width: '18px',
  height: '18px',
  border: '2px solid #e0e0e0',
  borderTop: '2px solid #1976d2',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  display: 'inline-block',
  flexShrink: 0,
};

const keyframesStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export function TextField({
  variant = 'outlined',
  size = 'md',
  type = 'text',
  label,
  placeholder,
  helperText,
  errorText,
  error = false,
  disabled = false,
  loading = false,
  required = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onChange,
  value,
}: TextFieldProps): React.ReactElement {
  const isError = error || !!errorText;
  const isDisabled = disabled || loading;
  const sizeValues = sizeMap[size];

  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.5 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto',
    fontFamily: 'system-ui, sans-serif',
  };

  const labelStyle: CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '4px',
    color: isError ? '#d32f2f' : '#374151',
  };

  const inputContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    height: sizeValues.height,
    borderRadius: '6px',
    border: variant === 'outlined'
      ? `1.5px solid ${isError ? '#d32f2f' : '#d1d5db'}`
      : 'none',
    borderBottom: variant === 'filled'
      ? `2px solid ${isError ? '#d32f2f' : '#d1d5db'}`
      : undefined,
    backgroundColor: variant === 'filled' ? '#f3f4f6' : '#ffffff',
    paddingLeft: leftIcon ? '8px' : sizeValues.padding.split(' ')[1],
    paddingRight: (rightIcon || loading) ? '8px' : sizeValues.padding.split(' ')[1],
    gap: '8px',
    transition: 'border-color 0.2s',
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: sizeValues.fontSize,
    color: '#111827',
    padding: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  const iconStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    flexShrink: 0,
  };

  const helperStyle: CSSProperties = {
    fontSize: '11px',
    marginTop: '4px',
    color: isError ? '#d32f2f' : '#6b7280',
  };

  const displayHelperText = isError && errorText ? errorText : helperText;

  return (
    <div style={wrapperStyle}>
      <style>{keyframesStyle}</style>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: '#d32f2f', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <div style={inputContainerStyle}>
        {!loading && leftIcon && (
          <span style={iconStyle} aria-hidden="true">{leftIcon}</span>
        )}
        {loading ? (
          <span
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            aria-label="loading"
            role="status"
          >
            <span style={spinnerStyle} />
          </span>
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            disabled={isDisabled}
            required={required}
            onChange={onChange}
            value={value}
            style={inputStyle}
            aria-invalid={isError}
            aria-required={required}
          />
        )}
        {!loading && rightIcon && (
          <span style={iconStyle} aria-hidden="true">{rightIcon}</span>
        )}
      </div>
      {displayHelperText && (
        <span style={helperStyle} role={isError ? 'alert' : undefined}>
          {displayHelperText}
        </span>
      )}
    </div>
  );
}
