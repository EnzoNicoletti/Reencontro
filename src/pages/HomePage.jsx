import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Loader2,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PetCard from '../components/PetCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import { subscribeActiveReports } from '../services/reportService.js';
import { seedDemoReports } from '../utils/demoSeed.js';
import {
  NEIGHBORHOOD_PRESETS,
  calculateDistanceKm,
  requestBrowserLocation,
} from '../utils/geo.js';

export default function HomePage() {
  const { user, isAuthenticated, isVerified } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [userCoords, setUserCoords] = useState(null);
  const [regionLabel, setRegionLabel] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const [seeding, setSeeding] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeActiveReports(
      (items) => {
        setReports(items);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(getFriendlyFirebaseError(err));
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleUseLocation = async () => {
    setGeoLoading(true);
    try {
      const coords = await requestBrowserLocation();
      setUserCoords(coords);
      setRegionLabel('Sua região aproximada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível obter a localização.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handlePresetRegion = (e) => {
    const id = e.target.value;
    if (!id) {
      setUserCoords(null);
      setRegionLabel('');
      return;
    }
    const found = NEIGHBORHOOD_PRESETS.find((p) => p.id === id);
    if (found) {
      setUserCoords({ lat: found.lat, lng: found.lng });
      setRegionLabel(`${found.neighborhood}, ${found.city}`);
    }
  };

  const handleSeedDemo = async () => {
    if (!user) return;
    setSeeding(true);
    setSeedFeedback('');
    setError('');
    try {
      const count = await seedDemoReports(user);
      setSeedFeedback(`${count} relatos de demonstração foram salvos no Firestore.`);
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setSeeding(false);
    }
  };

  const displayedReports = useMemo(() => {
    const filtered = reports.filter((r) => (filterType === 'all' ? true : r.type === filterType));
    if (!userCoords) {
      return filtered.slice(0, 6);
    }
    return filtered
      .map((r) => ({
        ...r,
        distanceKm: calculateDistanceKm(userCoords.lat, userCoords.lng, r.lat, r.lng),
      }))
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, 6);
  }, [reports, filterType, userCoords]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-10">
      {/* Hero Section */}
      <section className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#E2E9E1] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-card flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#52765A] tracking-wide">
              Rede comunitária de reencontros
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#26352B] leading-[1.15] tracking-tight text-balance">
              Ajude quem se perdeu a voltar para casa com segurança
            </h1>
            <p className="text-base sm:text-lg text-[#6B786D] leading-relaxed max-w-xl">
              Publique relatos de animais desaparecidos ou encontrados na sua região, descubra possíveis correspondências por proximidade e converse sem expor dados pessoais.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/reportar/perdido"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <PawPrint className="w-4 h-4" />
                Perdi um animal
              </Link>
              <Link
                to="/reportar/encontrado"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <HeartHandshake className="w-4 h-4 text-[#52765A]" />
                Encontrei um animal
              </Link>
            </div>
            <div>
              <Link
                to="/buscar"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#52765A] hover:text-[#425E48] py-1"
              >
                <Search className="w-4 h-4" />
                <span>Explorar relatos e buscar possíveis correspondências</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-[#E2E9E1] bg-[#EAF5EC] min-h-[240px] lg:min-h-full shadow-card">
          <img
            src="/src/assets/images/hero_reunion_pet_1795453725606.jpg"
            alt="Tutora abraçando seu cão caramelo após o reencontro em um parque arborizado"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Community Alert Banner (Warm Neutral #F3EEE4) */}
      <section className="rounded-2xl bg-[#F3EEE4] border border-[#E7DDD0] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-[#E7DDD0] text-[#52765A] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-[#26352B]">
              Proximidade primeiro, privacidade sempre
            </h2>
            <p className="text-sm text-[#6B786D] leading-relaxed max-w-2xl">
              Nossa busca prioriza a distância geográfica porque descrições de pelagem ou porte podem variar. Seu e-mail, telefone e endereço exato nunca ficam visíveis nos relatos públicos.
            </p>
          </div>
        </div>
        <Link
          to="/buscar"
          className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg bg-white border border-[#E2E9E1] hover:bg-[#EAF5EC] text-[#26352B] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#52765A]" />
          Ver correspondências
        </Link>
      </section>

      {/* Nearby / Recent Animal Reports */}
      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#26352B]">
              {regionLabel ? `Relatos próximos a ${regionLabel}` : 'Relatos recentes na comunidade'}
            </h2>
            <p className="text-sm text-[#6B786D] mt-1">
              Acompanhe animais perdidos e encontrados publicados recentemente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter segmented control */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[#E2E9E1]">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'lost', label: 'Perdidos' },
                { key: 'found', label: 'Encontrados' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  className={`px-3.5 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterType === tab.key
                      ? 'bg-[#52765A] text-white'
                      : 'text-[#6B786D] hover:text-[#26352B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Filtrar por bairro de referência"
              onChange={handlePresetRegion}
              defaultValue=""
              className="h-11 px-3.5 rounded-xl bg-white border border-[#E2E9E1] text-xs font-medium text-[#26352B] focus:outline-none focus:border-[#52765A]"
            >
              <option value="">Escolher bairro...</option>
              {NEIGHBORHOOD_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.neighborhood}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={geoLoading}
              onClick={handleUseLocation}
              className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-xl bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {geoLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#52765A]" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-[#52765A]" />
              )}
              Perto de mim
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-4 text-sm text-[#B04332]">
            {error}
          </div>
        )}

        {seedFeedback && (
          <div className="rounded-xl bg-[#EAF5EC] border border-[#CDE6D2] p-4 text-sm text-[#3E7B52]">
            {seedFeedback}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-[#E2E9E1] rounded-2xl p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-[4/3] rounded-xl bg-[#EAF5EC]" />
                <div className="h-5 w-1/2 rounded bg-[#E2E9E1]" />
                <div className="h-4 w-3/4 rounded bg-[#E2E9E1]" />
              </div>
            ))}
          </div>
        ) : displayedReports.length === 0 ? (
          <div className="bg-white border border-[#E2E9E1] rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-display text-lg font-semibold text-[#26352B]">
                Nenhum relato ativo encontrado ainda
              </h3>
              <p className="text-sm text-[#6B786D]">
                Publique o primeiro relato de animal perdido ou encontrado para iniciar a rede de apoio na sua região.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/reportar"
                className="inline-flex items-center justify-center px-5 h-11 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors"
              >
                Publicar um relato
              </Link>
              {isAuthenticated && isVerified && (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={handleSeedDemo}
                  className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {seeding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Carregar relatos de demonstração
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedReports.map((report) => (
                <PetCard key={report.reportId || report.id} report={report} />
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Link
                to="/buscar"
                className="inline-flex items-center gap-2 px-6 h-12 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors"
              >
                Ver todos os relatos e buscar correspondências
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
