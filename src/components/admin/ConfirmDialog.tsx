import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '確認刪除',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 space-y-4"
        style={{ animation: 'confirmDialogIn 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2C2C2C] text-base">{title}</h3>
            <p className="mt-1 text-sm text-[#8C8C8C] leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes confirmDialogIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
