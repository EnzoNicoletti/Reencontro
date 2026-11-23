import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Database,
  Edit3,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal.jsx';
import PetCard from '../components/PetCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import { logoutUser, updateUserProfileData } from '../services/authService.js';
import {
  deleteReport,
  markReportResolved,
  subscribeUserReports,
} from '../services/reportService.js';
import { uploadProfileAvatar } from '../services/storageService.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';
import { seedDemoReports } from '../utils/demoSeed.js';

export default function ProfilePage() {
  const { user, profile, isVerified, reloadProfile } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [statusTab, setStatusTab] = useState('active');

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const [modalState, setModalState] = useState({ open: false, action: null, report: null });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || '');
    setCity(profile?.city || '');
  }, [profile, user]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = subscribeUserReports(
      user.uid,
      (items) => {
        setReports(items);
        setLoadingReports(false);
      },
      (err) => {
        setError(getFriendlyFirebaseError(err));
        setLoadingReports(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Informe seu nome de exibição.');
      return;
    }
    setSavingProfile(true);
    setError('');
    setFeedback('');
    try {
      await updateUserProfileData({
        displayName,
        city,
        photoURL: profile?.photoURL || user?.photoURL || '',
      });
      await reloadProfile();
      setEditingProfile(false);
      setFeedback('Perfil atualizado com sucesso.');
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    setAvatarLoading(true);
    setError('');
    setFeedback('');
    try {
      const url = await uploadProfileAvatar(file, user.uid);
      await updateUserProfileData({
        displayName: displayName || user.displayName || 'Tutor',
        city,
        photoURL: url,
      });
      await reloadProfile();
      setFeedback('Foto de perfil atualizada.');
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/', { replace: true });
  };

  const handleConfirmReportAction = async () => {
    if (!modalState.report) return;
    setModalLoading(true);
    setError('');
    try {
      if (modalState.action === 'resolve') {
        await markReportResolved(modalState.report.reportId);
        setFeedback('Relato marcado como reencontrado.');
      } else if (modalState.action === 'delete') {
        await deleteReport(modalState.report.reportId);
        setFeedback('Relato excluído.');
      }
      setModalState({ open: false, action: null, report: null });
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
      setModalState({ open: false, action: null, report: null });
    } finally {
      setModalLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    setError('');
    setFeedback('');
    try {
      const count = await seedDemoReports(user);
      setFeedback(`${count} relatos de demonstração salvos no Firestore.`);
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setSeeding(false);
    }
  };

  const activeReports = reports.filter((r) => r.status === 'active');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');
  const shownReports = statusTab === 'active' ? activeReports : resolvedReports;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8">
      {error && (
        <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-4 text-sm text-[#B04332]">
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-xl bg-[#EAF5EC] border border-[#CDE6D2] p-4 text-sm text-[#3E7B52]">
          {feedback}
        </div>
      )}

      {/* User Info Card */}
      <section className="bg-white border border-[#E2E9E1] rounded-2xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.photoURL || user?.photoURL ? (
                <img
                  src={profile?.photoURL || user?.photoURL}
                  alt={profile?.displayName || user?.displayName || 'Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border border-[#E2E9E1]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#EAF5EC] text-[#52765A] flex items-center justify-center border border-[#E2E9E1]">
                  <User className="w-8 h-8" />
                </div>
              )}

              <label
                title="Alterar foto de perfil"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#52765A] hover:bg-[#425E48] text-white flex items-center justify-center cursor-pointer shadow-xs"
              >
                {avatarLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#26352B]">
                {profile?.displayName || user?.displayName || 'Tutor'}
              </h1>
              <p className="text-sm text-[#6B786D]">{user?.email}</p>
              <p className="text-xs text-[#52765A] font-medium">
                {profile?.city ? profile.city : 'Cidade não informada'}
                {' · '}
                {isVerified ? 'Conta verificada' : 'Aguardando verificação de e-mail'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditingProfile((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              {editingProfile ? 'Fechar edição' : 'Editar perfil'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg bg-white border border-[#E2E9E1] hover:bg-[#FDF0ED] hover:text-[#B04332] text-[#26352B] text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {editingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-[#E2E9E1] grid sm:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-[#26352B] mb-1.5">
                Nome público
              </label>
              <input
                id="prof-name"
                type="text"
                maxLength={VALIDATION_LIMITS.DISPLAY_NAME_MAX}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-sm text-[#26352B] focus:outline-none focus:border-[#52765A]"
              />
            </div>

            <div>
              <label htmlFor="prof-city" className="block text-xs font-semibold text-[#26352B] mb-1.5">
                Cidade e estado
              </label>
              <input
                id="prof-city"
                type="text"
                maxLength={VALIDATION_LIMITS.CITY_MAX}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex.: São Paulo - SP"
                className="w-full h-11 px-3.5 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-sm text-[#26352B] focus:outline-none focus:border-[#52765A]"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="h-11 px-5 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar perfil
            </button>
          </form>
        )}
      </section>

      {/* My Reports Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-2xl font-bold text-[#26352B]">Meus relatos</h2>
            <div className="inline-flex p-1 rounded-xl bg-white border border-[#E2E9E1]">
              <button
                type="button"
                onClick={() => setStatusTab('active')}
                className={`px-3.5 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                  statusTab === 'active' ? 'bg-[#52765A] text-white' : 'text-[#6B786D]'
                }`}
              >
                Ativos ({activeReports.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('resolved')}
                className={`px-3.5 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                  statusTab === 'resolved' ? 'bg-[#52765A] text-white' : 'text-[#6B786D]'
                }`}
              >
                Reencontrados ({resolvedReports.length})
              </button>
            </div>
          </div>

          <Link
            to="/reportar"
            className="inline-flex items-center justify-center gap-1.5 px-5 h-11 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors whitespace-nowrap self-start"
          >
            <Plus className="w-4 h-4" />
            Novo relato
          </Link>
        </div>

        {loadingReports ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-[#6B786D]">
            <Loader2 className="w-5 h-5 animate-spin text-[#52765A]" />
            <span>Carregando seus relatos...</span>
          </div>
        ) : shownReports.length === 0 ? (
          <div className="bg-white border border-[#E2E9E1] rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-[#6B786D]">
              {statusTab === 'active'
                ? 'Você não possui relatos ativos no momento.'
                : 'Nenhum relato marcado como reencontrado ainda.'}
            </p>
            {statusTab === 'active' && (
              <Link
                to="/reportar"
                className="inline-flex items-center justify-center px-5 h-11 rounded-lg bg-[#DCEBDD] text-[#26352B] text-xs font-semibold"
              >
                Publicar um relato
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shownReports.map((report) => (
              <div key={report.reportId} className="flex flex-col gap-2">
                <PetCard report={report} />
                <div className="flex items-center gap-2">
                  {report.status === 'active' && (
                    <>
                      <Link
                        to={`/editar/${report.reportId}`}
                        className="flex-1 h-10 rounded-lg bg-white border border-[#E2E9E1] hover:bg-[#EAF5EC] text-[#26352B] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => setModalState({ open: true, action: 'resolve', report })}
                        className="flex-1 h-10 rounded-lg bg-[#EAF5EC] hover:bg-[#DCEBDD] text-[#3E7B52] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Reencontrado
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    aria-label="Excluir relato"
                    onClick={() => setModalState({ open: true, action: 'delete', report })}
                    className="w-10 h-10 rounded-lg bg-[#FDF0ED] hover:bg-[#F7D2CC] text-[#B04332] inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Development Demo Seed Utility */}
      <section className="rounded-2xl bg-[#F3EEE4] border border-[#E7DDD0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-[#52765A] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h3 className="font-display text-sm font-semibold text-[#26352B]">
              Ambiente de demonstração (opcional)
            </h3>
            <p className="text-xs text-[#6B786D] leading-relaxed">
              Popule o Firestore com 6 relatos fictícios de cães e gatos em bairros de São Paulo para testar a busca por geohash, correspondências e comparação por IA.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={seeding || !isVerified}
          onClick={handleSeedDemo}
          className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-lg bg-white border border-[#E2E9E1] hover:bg-[#EAF5EC] text-[#26352B] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          {seeding && <Loader2 className="w-4 h-4 animate-spin text-[#52765A]" />}
          Carregar dados de demonstração
        </button>
      </section>

      <ConfirmModal
        open={modalState.open}
        danger={modalState.action === 'delete'}
        loading={modalLoading}
        title={
          modalState.action === 'resolve'
            ? 'Marcar animal como reencontrado?'
            : 'Excluir relato?'
        }
        description={
          modalState.action === 'resolve'
            ? 'O relato ficará salvo na aba Reencontrados e deixará de aparecer nas buscas ativas.'
            : 'Esta ação apaga permanentemente o relato selecionado.'
        }
        confirmLabel={modalState.action === 'resolve' ? 'Confirmar reencontro' : 'Excluir'}
        onConfirm={handleConfirmReportAction}
        onCancel={() => setModalState({ open: false, action: null, report: null })}
      />
    </div>
  );
}
