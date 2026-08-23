import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-10 px-3.5 rounded-xl border border-ink-300 bg-white text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3.5 py-2.5 rounded-xl border border-ink-300 bg-white text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={`w-full h-10 px-3.5 rounded-xl border border-ink-300 bg-white text-sm text-ink-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <label className={`block text-sm font-semibold text-ink-700 mb-1.5 ${className}`}>{children}</label>;
}

export function Field({ label, children, className = '' }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  );
}
