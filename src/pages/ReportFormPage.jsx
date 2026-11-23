import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ReportForm from '../components/ReportForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import { getReportById } from '../services/reportService.js';

export default function ReportFormPage({ mode = 'lost' }) {
  const { reportId } = useParams();
  const { user } = useAuth();
  const isEditing = Boolean(reportId);

  const [existingReport, setExistingReport] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;
    setLoading(true);
    getReportById(reportId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('Relato não encontrado.');
        } else if (data.userId !== user?.uid) {
          setError('Você só pode editar relatos publicados pela sua própria conta.');
        } else {
          setExistingReport(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getFriendlyFirebaseError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditing, reportId, user?.uid]);

  const effectiveMode = existingReport?.type || mode;
  const heading = isEditing
    ? 'Editar relato'
    : effectiveMode === 'lost'
      ? 'Relatar animal perdido'
      : 'Relatar animal encontrado ou avistado';

  const subtitle = isEditing
    ? 'Atualize as informações ou adicione novas fotografias para melhorar as correspondências.'
    : effectiveMode === 'lost'
      ? 'Preencha os detalhes com calma. Assim que publicar, buscaremos relatos próximos compatíveis.'
      : 'Compartilhe o máximo de detalhes visuais e a região aproximada para facilitar o reencontro.';

  return (
    <div className="max-w-[820px] mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6">
      <div className="space-y-3">
        <Link
          to={isEditing ? `/relato/${reportId}` : '/reportar'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52765A] hover:text-[#425E48]"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26352B]">{heading}</h1>
          <p className="text-sm sm:text-base text-[#6B786D] mt-1">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2E9E1] rounded-2xl p-10 flex items-center justify-center gap-3 text-sm text-[#6B786D]">
          <Loader2 className="w-5 h-5 animate-spin text-[#52765A]" />
          <span>Carregando dados do relato...</span>
        </div>
      ) : error ? (
        <div className="bg-white border border-[#E2E9E1] rounded-2xl p-6 space-y-4">
          <p className="text-sm text-[#B04332]">{error}</p>
          <Link
            to="/perfil"
            className="inline-flex items-center justify-center px-5 h-11 rounded-lg bg-[#DCEBDD] text-[#26352B] text-sm font-semibold"
          >
            Ir para meus relatos
          </Link>
        </div>
      ) : (
        <ReportForm mode={effectiveMode} existingReport={existingReport} />
      )}
    </div>
  );
}
