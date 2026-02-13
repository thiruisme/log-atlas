'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  disabled?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  disabled = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-card border-2 border-card-border p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex justify-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-error-bg text-error' : 'bg-accent/10 text-accent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none text-foreground">
          {title}
        </h2>
        <p className="text-text-secondary font-medium italic text-[14px] mb-8 px-4">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`w-full py-4 rounded-xl font-black text-lg uppercase italic tracking-tighter transition-all ${
              disabled
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:scale-[1.02] active:scale-[0.98]'
            } ${
              variant === 'danger'
                ? 'bg-error text-black shadow-lg shadow-error/20'
                : 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
            }`}
          >
            {confirmText}
          </button>
          {!disabled && (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-black text-sm uppercase italic tracking-tighter text-text-muted hover:text-foreground transition-colors"
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
