// src/components/FormError.tsx
import React from 'react';

type Props = {
  message?: string;
};

export default function FormError({ message }: Props) {
  if (!message) return null;
  return (
    <small style={{ color: 'red', display: 'block', marginTop: '2px' }}>
      {message}
    </small>
  );
}
