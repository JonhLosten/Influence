import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const baseClasses = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500',
  secondary: 'bg-slate-800 text-white hover:bg-slate-700',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
};

export function Button({ variant = 'primary', loading = false, children, className, disabled, ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={clsx(baseClasses, variantClasses[variant], className)}
    >
      {loading && (
        <span className="mr-2 inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
