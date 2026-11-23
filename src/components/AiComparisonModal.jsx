import { useEffect, useState } from 'react';
import { AlertTriangle, Info, PawPrint, Sparkles, X } from 'lucide-react';
import { comparePetPhotosWithAI } from '../services/aiComparisonService.js';
import { getReportDisplayTitle, getReportTypeLabel } from '../utils/constants.js';

export default function AiComparisonModal({ open, reportA, reportB, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!open || !reportA || !reportB) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setAnalysis(null);

    comparePetPhotosWithAI(reportA, reportB)
      .then((result) => {
        if (!cancelled) {
          setAnalysis(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível concluir a comparação.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, reportA, reportB]);

  if (!open || !reportA || !reportB) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26352B]/45 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-compare-title"
    >
      <div className="max-w-2xl w-full bg-white border border-[#E2E9E1] rounded-2xl p-6 shadow-modal space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 id="ai-compare-title" className="font-display text-lg font-semibold text-[#26352B]">
                Comparação visual assistida por IA
              </h2>
              <p className="text-xs text-[#6B786D]">
                Observação auxiliar de pelagem, marcações e aparência — sem substituir verificação humana.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar comparação"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B786D] hover:bg-[#EAF5EC] hover:text-[#26352B] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two reports side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          {[reportA, reportB].map((rep, idx) => (
            <div
              key={rep.reportId || idx}
              className="border border-[#E2E9E1] rounded-xl p-2.5 bg-[#F7F9F6] space-y-2"
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#EAF5EC]">
                {rep.photoUrls?.[0] ? (
                  <img
                    src={rep.photoUrls[0]}
                    alt={getReportDisplayTitle(rep)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#52765A]">
                    <PawPrint className="w-8 h-8 opacity-60" />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#52765A]">
                  {getReportTypeLabel(rep.type)}
                </span>
                <p className="text-sm font-semibold text-[#26352B] truncate">
                  {getReportDisplayTitle(rep)}
                </p>
                <p className="text-xs text-[#6B786D] truncate">{rep.neighborhood}</p>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-7 h-7 rounded-full border-2 border-[#52765A] border-t-transparent animate-spin" />
            <p className="text-sm text-[#6B786D]">
              Analisando cuidadosamente as duas fotografias...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-4 flex items-start gap-3 text-sm text-[#B04332]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Comparação indisponível no momento</p>
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#EAF5EC] border border-[#CDE6D2] p-4">
              <p className="text-sm text-[#26352B] leading-relaxed">{analysis.summary}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="border border-[#E2E9E1] rounded-xl p-3.5 space-y-1.5">
                <h3 className="font-semibold text-[#26352B] text-xs">Semelhanças na pelagem</h3>
                <ul className="space-y-1 text-xs text-[#6B786D]">
                  {(analysis.coatSimilarities || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="border border-[#E2E9E1] rounded-xl p-3.5 space-y-1.5">
                <h3 className="font-semibold text-[#26352B] text-xs">Manchas e marcações visíveis</h3>
                <ul className="space-y-1 text-xs text-[#6B786D]">
                  {(analysis.markingSimilarities || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="border border-[#E2E9E1] rounded-xl p-3.5 space-y-1.5">
                <h3 className="font-semibold text-[#26352B] text-xs">Aparência física</h3>
                <ul className="space-y-1 text-xs text-[#6B786D]">
                  {(analysis.physicalSimilarities || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="border border-[#E2E9E1] rounded-xl p-3.5 space-y-1.5">
                <h3 className="font-semibold text-[#26352B] text-xs">Diferenças ou pontos de atenção</h3>
                <ul className="space-y-1 text-xs text-[#6B786D]">
                  {(analysis.relevantDifferences || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-[#F3EEE4] border border-[#E7DDD0] p-3.5 flex items-start gap-2.5 text-xs text-[#26352B]">
              <Info className="w-4 h-4 text-[#52765A] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{analysis.cautionNote}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-11 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
