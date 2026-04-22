import React from 'react'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  isLoading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-teal hover:bg-teal-light text-navy font-semibold focus:ring-teal',
  secondary:
    'bg-purple/20 hover:bg-purple/40 text-gray-light border border-purple/40 focus:ring-purple',
  danger:
    'bg-pink-brand/20 hover:bg-pink-brand/40 text-pink-brand border border-pink-brand/40 focus:ring-pink-brand',
}

export default function PrimaryButton({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-card px-5 py-2.5',
        'text-sm transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
