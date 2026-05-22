import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant: Variant
  size: Size
  disabled?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
  md: { height: '40px', padding: '0 16px', fontSize: '15px' },
  lg: { height: '56px', padding: '0 24px', fontSize: '15px' },
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: '#0BCE83', color: 'white', border: 'none' },
  secondary: { backgroundColor: 'transparent', color: '#0BCE83', border: '2px solid #0BCE83' },
  ghost: { backgroundColor: 'transparent', color: '#958CA8', border: 'none' },
}

const Spinner = () => (
  <span style={{
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'button-spin 0.6s linear infinite',
  }} />
)

export function Button({
  variant,
  size,
  disabled = false,
  loading = false,
  leftIcon,
  fullWidth = false,
  onClick,
  type = 'button',
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    fontFamily: 'inherit',
    lineHeight: 1,
    ...sizeStyles[size],
    ...variantStyles[variant],
  }

  return (
    <>
      <style>{`@keyframes button-spin { to { transform: rotate(360deg); } }`}</style>
      <button
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        style={style}
      >
        {loading ? <Spinner /> : (
          <>
            {leftIcon}
            {children}
          </>
        )}
      </button>
    </>
  )
}
