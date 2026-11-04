import type { ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
};
const styles = {
  primary: 'bg-accent text-white hover:bg-accent-dark shadow-xs',
  secondary: 'border border-line bg-white text-ink hover:bg-stone-50',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'text-muted hover:bg-stone-100 hover:text-ink',
};

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}: Props) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  );
}
