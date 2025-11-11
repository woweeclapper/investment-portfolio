import React from 'react';

type Variant = 'primary' | 'danger' | 'muted';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', style, children, ...props }, ref) => {
    const base: React.CSSProperties = {
      border: 'none',
      padding: '0.45rem 0.9rem',
      borderRadius: 6,
      color: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      lineHeight: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s ease, box-shadow 0.2s ease',
    };

    const variants: Record<Variant, React.CSSProperties> = {
      primary: { background: '#3b82f6' },
      danger: { background: '#dc3545' },
      muted: {
        background: '#6c757d',
        border: '1px solid rgba(255,255,255,0.06)',
      },
    };

    return (
      <button
        ref={ref}
        {...props}
        style={{ ...base, ...variants[variant], ...style }}
        className={`app-button ${variant}`}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button'; // helpful for React DevTools

export default Button;
