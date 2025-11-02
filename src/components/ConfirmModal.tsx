import React, { useState, useEffect, useRef } from 'react';
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

export default function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts: Escape = cancel, Enter = confirm
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm(dontAskAgain);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dontAskAgain, onCancel, onConfirm]);

  // Focus trap: keep tabbing inside modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    modal.addEventListener('keydown', handleTab);
    (first || modal).focus();

    return () => modal.removeEventListener('keydown', handleTab);
  }, []);

  return (
    <div style={backdropStyle} role="presentation" onClick={onCancel}>
      <div
        ref={modalRef}
        style={contentStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" style={{ marginTop: 0 }}>
          Confirm Action
        </h2>
        <p id="confirm-message" style={{ marginBottom: '0.75rem' }}>
          {message}
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          Don’t ask me again for this action
        </label>

        <div
          style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}
        >
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
