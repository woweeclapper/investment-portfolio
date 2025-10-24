import React from 'react';

interface BadgeProps {
  label: string;
  tone?: 'muted' | 'danger' | 'primary';
  style?: React.CSSProperties;
}

export default function Badge({ label, tone = 'muted', style }: BadgeProps) {
  // background + text colors mapped by tone
  const toneStyles: Record<'muted' | 'danger' | 'primary', { bg: string; color: string }> = {
    danger: { bg: '#3a1f24', color: '#ff6b6b' },
    primary: { bg: '#1f3327', color: '#7bd389' },
    muted: { bg: '#2b2f33', color: '#b5bcc3' },
  };

  const { bg, color } = toneStyles[tone];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 12,
        lineHeight: '16px',
        background: bg,
        color,
        border: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
