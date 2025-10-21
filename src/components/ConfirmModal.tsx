import React, { useState } from 'react';

type ConfirmModalProps = {
  message: string;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
};

// ✅ Define styles before using them
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', // darker overlay
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e', // dark modal background
  color: '#f1f1f1',           // light text
  padding: '1rem',
  borderRadius: '8px',
  minWidth: '280px',
  maxWidth: '420px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
};

const buttonBase: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const confirmButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#d9534f',
  color: 'white',
};

const cancelButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: '#6c757d',
  color: 'white',
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
          <button style={confirmButton} onClick={() => onConfirm(dontAskAgain)}>Confirm</button>
          <button style={cancelButton} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
