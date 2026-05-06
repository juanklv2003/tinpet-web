import React, { ButtonHTMLAttributes } from 'react'

type Variant = 'solid' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'solid', className = '', children, ...rest }: ButtonProps) {
  const base = 'rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants: Record<Variant, string> = {
    solid: `bg-[color:var(--tp-pink)] text-white hover:bg-[color:var(--tp-pink-dark)] shadow-sm ${base}`,
    ghost: `bg-transparent text-slate-600 hover:text-slate-900 ${base}`,
    outline: `bg-white border border-gray-200 text-slate-700 hover:border-brand ${base}`,
  }

  return (
    <button className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export default Button
