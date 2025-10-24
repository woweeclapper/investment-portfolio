
import React from 'react';

type Variant = 'primary' | 'danger' | 'muted';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Button({ variant = 'primary', style, children, ...props }: ButtonProps) {
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
  };

  const bg =
    variant === 'danger' ? '#dc3545' : variant === 'muted' ? '#6c757d' : '#3b82f6';
  const border = variant === 'muted' ? '1px solid rgba(255,255,255,0.06)' : 'none';

  return (
    <button {...props} style={{ ...base, background: bg, border, ...style }}>
      {children}
    </button>
  );
}
