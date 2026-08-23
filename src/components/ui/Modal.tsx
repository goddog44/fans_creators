import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <h3 className="font-display font-bold text-lg text-ink-900">{title}</h3>
            <button onClick={onClose} className="text-ink-400 hover:text-ink-900 transition-colors p-1 rounded-lg hover:bg-ink-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto scrollbar-thin">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ink-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`h-10 px-4 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? 'bg-danger-600 hover:bg-danger-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{message}</p>
    </Modal>
  );
}
