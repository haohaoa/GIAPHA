import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  LogOut, 
  UserPlus, 
  HelpCircle, 
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'create' | 'logout';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIconAndStyle = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-red-400" />,
          badgeBg: 'bg-red-950/60 border-red-800/80 text-red-400 shadow-red-950/50',
          confirmBtn: 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50',
        };
      case 'logout':
        return {
          icon: <LogOut className="w-6 h-6 text-amber-400" />,
          badgeBg: 'bg-amber-950/60 border-amber-800/80 text-amber-400 shadow-amber-950/50',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-amber-950/50',
        };
      case 'create':
        return {
          icon: <UserPlus className="w-6 h-6 text-emerald-400" />,
          badgeBg: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 shadow-emerald-950/50',
          confirmBtn: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          badgeBg: 'bg-amber-950/60 border-amber-800/80 text-amber-400 shadow-amber-950/50',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
        };
      case 'info':
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-blue-400" />,
          badgeBg: 'bg-blue-950/60 border-blue-800/80 text-blue-400 shadow-blue-950/50',
          confirmBtn: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
    }
  };

  const style = getIconAndStyle();

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onCancel} 
      />

      {/* Modal Card */}
      <div className="relative z-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-5 sm:p-6 text-center transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Close X */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-lg mb-3.5 ${style.badgeBg}`}>
          {style.icon}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-slate-100 text-base sm:text-lg tracking-tight mb-2 font-royal">
          {title}
        </h3>

        {/* Content Message */}
        <div className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 space-y-2">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-confirm-cancel"
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors border border-slate-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            id="btn-confirm-action"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 ${style.confirmBtn}`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
