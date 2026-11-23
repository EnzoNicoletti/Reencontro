import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import { getPublicUserProfile } from '../services/authService.js';
import { startOrGetConversation } from '../services/chatService.js';
import { deleteReport, getReportById, markReportResolved } from '../services/reportService.js';
import {
  getReportDisplayTitle,
  getSizeLabel,
  getSpeciesLabel,
} from '../utils/constants.js';
import { formatDatePtBr } from '../utils/geo.js';

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [report, setReport] = useState(null);
  const [publicAuthor, setPublicAuthor] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [confirmModal, setConfirmModal] = useState({ open: false, action: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getReportById(reportId)
      .then(async (data) => {
        if (cancelled) return;
        if (!data) {
          setError('Este relato não foi encontrado ou foi removido.');
          setLoading(false);
          return;
        }
        setReport(data);
        setActivePhotoIndex(0);
        const author = await getPublicUserProfile(data.userId);
        if (!cancelled) setPublicAuthor(author);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getFriendlyFirebaseError(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const isOwner = Boolean(user?.uid && report?.userId === user.uid);
  const photos = report?.photoUrls || [];

  const handleContact = async () => {
    if (!isAuthenticated) {
      navigate('/entrar', { state: { from: { pathname: `/relato/${reportId}` } } });
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const conversationId = await startOrGetConversation(user, report);
      navigate(`/mensagens/${conversationId}`);
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!report) return;
    setActionLoading(true);
    setError('');
    try {
      if (confirmModal.action === 'resolve') {
        await markReportResolved(report.reportId);
        setReport((prev) => ({ ...prev, status: 'resolved' }));
      } else if (confirmModal.action === 'delete') {
        await deleteReport(report.reportId);
        navigate('/perfil', { replace: true });
        return;
      }
      setConfirmModal({ open: false, action: null });
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
      setConfirmModal({ open: false, action: null });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1040px] mx-auto px-4 md:px-8 py-16 flex items-center justify-center gap-3 text-sm text-[#6B786D]">
        <Loader2 className="w-5 h-5 animate-spin text-[#52765A]" />
        <span>Carregando detalhes do relato...</span>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="max-w-[680px] mx-auto px-4 py-12">
        <div className="bg-white border border-[#E2E9E1] rounded-2xl p-8 text-center space-y-4">
          <p className="text-sm text-[#B04332]">{error}</p>
          <Link
            to="/buscar"
            className="inline-flex items-center justify-center px-5 h-11 rounded-lg bg-[#52765A] text-white text-sm font-semibold"
          >
            Voltar para a busca
          </Link>
        </div>
      </div>
    );
  }

  const isLost = report.type === 'lost';
  const isResolved = report.status === 'resolved';
  const statusBadge = isResolved
    ? { label: 'Reencontrado com a família', cls: 'bg-[#EAF5EC] text-[#3E7B52] border-[#CDE6D2]' }
    : isLost
      ? { label: 'Desaparecido', cls: 'bg-[#FDF0ED] text-[#B04332] border-[#F7D2CC]' }
      : { label: 'Encontrado / Avistado', cls: 'bg-[#EAF5EC] text-[#3E7B52] border-[#CDE6D2]' };

  return (
    <div className="max-w-[1080px] mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6">
      <Link
        to="/buscar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52765A] hover:text-[#425E48]"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para busca
      </Link>

      {error && (
        <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-4 text-sm text-[#B04332]">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Photos */}
        <div className="lg:col-span-6 space-y-3">
          <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden border border-[#E2E9E1] bg-[#EAF5EC] shadow-card">
            {photos[activePhotoIndex] ? (
              <img
                src={photos[activePhotoIndex]}
                alt={getReportDisplayTitle(report)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#52765A]">
                <PawPrint className="w-12 h-12 opacity-60" />
                <span className="text-sm text-[#6B786D]">Nenhuma fotografia enviada</span>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-colors ${
                    idx === activePhotoIndex ? 'border-[#52765A]' : 'border-[#E2E9E1] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Structured Details */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white border border-[#E2E9E1] rounded-2xl p-6 shadow-card space-y-5">
            <div className="space-y-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.cls}`}
              >
                {statusBadge.label}
              </span>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26352B]">
                {getReportDisplayTitle(report)}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6B786D]">
                <span className="inline-flex items-center gap-1.5 text-[#52765A] font-medium">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {report.neighborhood}, {report.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {isLost ? 'Desapareceu em ' : 'Visto/encontrado em '}
                  {formatDatePtBr(report.eventDate)}
                </span>
              </div>
            </div>

            {/* Physical attributes grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E9E1]">
              <div>
                <p className="text-xs text-[#6B786D]">Espécie</p>
                <p className="text-sm font-semibold text-[#26352B]">
                  {getSpeciesLabel(report.species)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B786D]">Porte aproximado</p>
                <p className="text-sm font-semibold text-[#26352B]">{getSizeLabel(report.size)}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B786D]">Raça</p>
                <p className="text-sm font-semibold text-[#26352B]">
                  {report.breed || 'Não informada'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B786D]">Cores da pelagem</p>
                <p className="text-sm font-semibold text-[#26352B]">
                  {(report.colors || []).join(', ')}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#E2E9E1]">
              <h2 className="text-xs font-semibold text-[#6B786D]">Características marcantes</h2>
              <p className="text-sm text-[#26352B] leading-relaxed whitespace-pre-line">
                {report.characteristics}
              </p>
            </div>

            {report.observations && (
              <div className="space-y-1.5 pt-2 border-t border-[#E2E9E1]">
                <h2 className="text-xs font-semibold text-[#6B786D]">Observações adicionais</h2>
                <p className="text-sm text-[#26352B] leading-relaxed whitespace-pre-line">
                  {report.observations}
                </p>
              </div>
            )}

            {/* Primary Actions */}
            <div className="pt-2 space-y-2.5">
              {!isOwner ? (
                <button
                  type="button"
                  disabled={actionLoading || isResolved}
                  onClick={handleContact}
                  className="w-full h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  {isResolved
                    ? 'Este caso já foi reencontrado'
                    : 'Entrar em contato pelo chat'}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {!isResolved && (
                    <>
                      <Link
                        to={`/editar/${report.reportId}`}
                        className="flex-1 h-11 px-4 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar relato
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ open: true, action: 'resolve' })}
                        className="flex-1 h-11 px-4 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar reencontrado
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ open: true, action: 'delete' })}
                    className="h-11 px-4 rounded-lg bg-[#FDF0ED] hover:bg-[#F7D2CC] text-[#B04332] text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              )}

              {!isResolved && (
                <Link
                  to={`/buscar?matchFor=${report.reportId}`}
                  className="w-full h-11 rounded-lg bg-[#F3EEE4] hover:bg-[#E7DDD0] text-[#26352B] text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#52765A]" />
                  Ver possíveis correspondências próximas
                </Link>
              )}
            </div>
          </div>

          {/* Public Responsible Profile (Zero PII) */}
          <div className="bg-white border border-[#E2E9E1] rounded-2xl p-4 sm:p-5 shadow-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {publicAuthor?.photoURL || report.authorPhotoURL ? (
                <img
                  src={publicAuthor?.photoURL || report.authorPhotoURL}
                  alt={publicAuthor?.displayName || report.authorName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-[#E2E9E1]"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#EAF5EC] text-[#52765A] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs text-[#6B786D]">Publicado por</p>
                <p className="text-sm font-semibold text-[#26352B]">
                  {publicAuthor?.displayName || report.authorName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B786D]">
              <ShieldCheck className="w-4 h-4 text-[#52765A]" />
              <span>Localização aproximada</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        danger={confirmModal.action === 'delete'}
        loading={actionLoading}
        title={
          confirmModal.action === 'resolve'
            ? 'Confirmar reencontro?'
            : 'Excluir relato permanentemente?'
        }
        description={
          confirmModal.action === 'resolve'
            ? 'Ao marcar como reencontrado, o relato sairá das buscas ativas de animais perdidos e ficará registrado como caso resolvido no seu perfil.'
            : 'Esta ação remove o relato do banco de dados e não poderá ser desfeita.'
        }
        confirmLabel={
          confirmModal.action === 'resolve' ? 'Sim, foi reencontrado' : 'Excluir relato'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ open: false, action: null })}
      />
    </div>
  );
}
