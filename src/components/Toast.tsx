'use client';

import { useEffect, useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 0;
let listener: ToastListener | null = null;

function notify() {
  listener?.([...toasts]);
}

export function toast(message: string, variant: ToastVariant = 'success') {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, 3000);
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listener = setItems;
    return () => { listener = null; };
  }, []);

  const dismiss = useCallback((id: number) => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => dismiss(item.id)}
          className={`pointer-events-auto px-5 py-3 rounded-xl font-black text-sm uppercase italic tracking-tight shadow-lg cursor-pointer animate-in slide-in-from-top-2 fade-in duration-200 ${
            item.variant === 'success'
              ? 'bg-accent text-accent-foreground'
              : 'bg-error text-white'
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
