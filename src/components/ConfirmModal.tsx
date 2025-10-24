import React, { useState } from 'react';
import Button from './Button';

type ConfirmModalProps = {
  message: string;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  color: '#f1f1f1',
  padding: '1rem',
  borderRadius: '8px',
  minWidth: '280px',
  maxWidth: '420px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
};

export default function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <div style={backdropStyle}>
      <div style={contentStyle}>
        <p style={{ marginBottom: '0.75rem' }}>{message}</p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          Don’t ask me again for this action
        </label>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="danger" onClick={() => onConfirm(dontAskAgain)}>
            Confirm
          </Button>
          <Button variant="muted" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
