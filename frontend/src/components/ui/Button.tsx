import type { ButtonHTMLAttributes } from 'react'

type Variant = 'solid' | 'ghost' | 'outline' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'solid', className = '', children, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold ' +
    'transition-[background-color,border-color,box-shadow,opacity,transform] duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]'

  const variants: Record<Variant, string> = {
    solid:
      'bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/20 ' + base,
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 ' +
      'dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-100 ' + base,
    outline:
      'border border-gray-200 bg-white text-gray-700 hover:border-brand hover:text-brand ' +
      'dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:border-brand dark:hover:text-brand ' + base,
    danger:
      'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20 ' + base,
  }

  return (
    <button className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export default Button
