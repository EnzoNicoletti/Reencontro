import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26352B]/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="max-w-md w-full bg-white border border-[#E2E9E1] rounded-2xl p-6 shadow-modal space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-modal-title" className="font-display text-lg font-semibold text-[#26352B]">
            {title}
          </h2>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            aria-label="Fechar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B786D] hover:bg-[#EAF5EC] hover:text-[#26352B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#6B786D] leading-relaxed">{description}</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 h-11 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 h-11 rounded-lg text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
              danger ? 'bg-[#C85A48] hover:bg-[#B04332]' : 'bg-[#52765A] hover:bg-[#425E48]'
            }`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
