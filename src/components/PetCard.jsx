import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, PawPrint, Sparkles } from 'lucide-react';
import { getReportDisplayTitle, getSizeLabel, getSpeciesLabel } from '../utils/constants.js';
import { formatDatePtBr, formatDistancePtBr } from '../utils/geo.js';

export default function PetCard({ report, matchReasons = null, onCompareAI = null }) {
  const [imgError, setImgError] = useState(false);
  const photo = report?.photoUrls?.[0];
  const isLost = report?.type === 'lost';
  const isResolved = report?.status === 'resolved';

  const statusBadge = isResolved
    ? {
        label: 'Reencontrado',
        cls: 'bg-[#EAF5EC] text-[#3E7B52] border-[#CDE6D2]',
      }
    : isLost
      ? {
          label: 'Desaparecido',
          cls: 'bg-[#FDF0ED] text-[#B04332] border-[#F7D2CC]',
        }
      : {
          label: 'Encontrado',
          cls: 'bg-[#EAF5EC] text-[#3E7B52] border-[#CDE6D2]',
        };

  return (
    <article className="bg-white border border-[#E2E9E1] rounded-2xl p-3.5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col">
      <Link to={`/relato/${report.reportId || report.id}`} className="block group">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#EAF5EC]">
          {photo && !imgError ? (
            <img
              src={photo}
              alt={getReportDisplayTitle(report)}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#52765A] bg-gradient-to-br from-[#EAF5EC] to-[#DCEBDD] p-4 text-center">
              <PawPrint className="w-9 h-9 opacity-70" />
              <span className="text-xs font-medium text-[#6B786D]">
                {getSpeciesLabel(report?.species)} sem foto enviada
              </span>
            </div>
          )}

          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
        </div>

        <div className="pt-3.5 px-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-[#26352B] leading-snug line-clamp-1">
              {getReportDisplayTitle(report)}
            </h3>
            {typeof report.distanceKm === 'number' && (
              <span className="text-xs font-semibold text-[#52765A] whitespace-nowrap shrink-0 tabular-nums pt-0.5">
                {formatDistancePtBr(report.distanceKm)}
              </span>
            )}
          </div>

          <p className="text-sm text-[#6B786D] truncate">
            {[
              getSpeciesLabel(report.species),
              report.breed || null,
              `Porte ${getSizeLabel(report.size).toLowerCase()}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B786D] pt-0.5">
            <span className="inline-flex items-center gap-1 text-[#52765A] font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[190px]">
                {report.neighborhood}
                {report.city ? `, ${report.city}` : ''}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDatePtBr(report.eventDate)}</span>
            </span>
          </div>
        </div>
      </Link>

      {Array.isArray(matchReasons) && matchReasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E2E9E1] px-1 space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#26352B] mb-1.5">
              Por que pode corresponder:
            </p>
            <ul className="space-y-1 text-xs text-[#6B786D]">
              {matchReasons.slice(0, 4).map((reason, idx) => (
                <li key={idx} className="leading-snug">
                  • {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Link
              to={`/relato/${report.reportId || report.id}`}
              className="flex-1 inline-flex items-center justify-center h-10 px-3 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Ver detalhes
            </Link>
            {onCompareAI && (
              <button
                type="button"
                onClick={() => onCompareAI(report)}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg bg-[#F3EEE4] hover:bg-[#E7DDD0] text-[#26352B] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#52765A]" />
                Comparar fotos
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
