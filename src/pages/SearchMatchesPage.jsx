import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  Filter,
  Loader2,
  MapPin,
  PawPrint,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import AiComparisonModal from '../components/AiComparisonModal.jsx';
import PetCard from '../components/PetCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import {
  findPossibleMatches,
  getReportById,
  queryReportsByProximity,
  subscribeActiveReports,
  subscribeUserReports,
} from '../services/reportService.js';
import {
  COLOR_OPTIONS,
  RADIUS_OPTIONS,
  SIZE_OPTIONS,
  SPECIES_OPTIONS,
  getReportDisplayTitle,
  getReportTypeLabel,
} from '../utils/constants.js';
import { NEIGHBORHOOD_PRESETS, requestBrowserLocation } from '../utils/geo.js';

export default function SearchMatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const matchForId = searchParams.get('matchFor') || '';
  const { user } = useAuth();

  const [mode, setMode] = useState(matchForId ? 'matches' : 'explore');
  const [allReports, setAllReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Explore filters
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterColor, setFilterColor] = useState('');
  const [geoCenter, setGeoCenter] = useState(null);
  const [geoLabel, setGeoLabel] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [geoResults, setGeoResults] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Match mode state
  const [selectedRefId, setSelectedRefId] = useState(matchForId);
  const [referenceReport, setReferenceReport] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Gemini Visual Comparison modal
  const [compareCandidate, setCompareCandidate] = useState(null);

  useEffect(() => {
    const unsub = subscribeActiveReports(
      (items) => {
        setAllReports(items);
        setLoading(false);
      },
      (err) => {
        setError(getFriendlyFirebaseError(err));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setMyReports([]);
      return undefined;
    }
    return subscribeUserReports(
      user.uid,
      (items) => setMyReports(items.filter((r) => r.status === 'active')),
      () => {}
    );
  }, [user?.uid]);

  useEffect(() => {
    if (matchForId) {
      setMode('matches');
      setSelectedRefId(matchForId);
    }
  }, [matchForId]);

  // Run proximity query when geoCenter or radius changes in Explore mode
  useEffect(() => {
    if (mode !== 'explore' || !geoCenter) {
      setGeoResults(null);
      return;
    }
    let cancelled = false;
    setGeoLoading(true);
    queryReportsByProximity({
      lat: geoCenter.lat,
      lng: geoCenter.lng,
      radiusKm,
      type: filterType,
    })
      .then((items) => {
        if (!cancelled) setGeoResults(items);
      })
      .catch((err) => {
        if (!cancelled) setError(getFriendlyFirebaseError(err));
      })
      .finally(() => {
        if (!cancelled) setGeoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, geoCenter, radiusKm, filterType]);

  // Run priority matching when selectedRefId or radiusKm changes in Matches mode
  useEffect(() => {
    if (mode !== 'matches' || !selectedRefId) {
      setReferenceReport(null);
      setMatchResults([]);
      return;
    }
    let cancelled = false;
    setMatchingLoading(true);
    setError('');

    const loadAndMatch = async () => {
      try {
        const localFound =
          allReports.find((r) => (r.reportId || r.id) === selectedRefId) ||
          myReports.find((r) => (r.reportId || r.id) === selectedRefId);
        const refReport = localFound || (await getReportById(selectedRefId));

        if (!refReport) {
          if (!cancelled) {
            setReferenceReport(null);
            setMatchResults([]);
            setError('Relato de referência não encontrado.');
          }
          return;
        }
        if (!cancelled) setReferenceReport(refReport);

        const matches = await findPossibleMatches(refReport, radiusKm);
        if (!cancelled) setMatchResults(matches);
      } catch (err) {
        if (!cancelled) setError(getFriendlyFirebaseError(err));
      } finally {
        if (!cancelled) setMatchingLoading(false);
      }
    };

    loadAndMatch();
    return () => {
      cancelled = true;
    };
  }, [mode, selectedRefId, radiusKm, allReports, myReports]);

  const handleUseCurrentGeo = async () => {
    setGeoLoading(true);
    setError('');
    try {
      const coords = await requestBrowserLocation();
      setGeoCenter(coords);
      setGeoLabel('Sua localização aproximada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSelectPreset = (e) => {
    const id = e.target.value;
    if (!id) {
      setGeoCenter(null);
      setGeoLabel('');
      return;
    }
    const preset = NEIGHBORHOOD_PRESETS.find((p) => p.id === id);
    if (preset) {
      setGeoCenter({ lat: preset.lat, lng: preset.lng });
      setGeoLabel(`${preset.neighborhood}, ${preset.city}`);
    }
  };

  const handleSelectMatchRef = (id) => {
    setSelectedRefId(id);
    if (id) {
      setSearchParams({ matchFor: id });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterType('all');
    setFilterSpecies('all');
    setFilterSize('all');
    setFilterColor('');
    setGeoCenter(null);
    setGeoLabel('');
    setRadiusKm(25);
  };

  const filteredExploreReports = useMemo(() => {
    const source = geoCenter && geoResults ? geoResults : allReports;
    const term = searchText.trim().toLowerCase();

    return source.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterSpecies !== 'all' && item.species !== filterSpecies) return false;
      if (filterSize !== 'all' && item.size !== filterSize) return false;
      if (
        filterColor &&
        !(item.colors || []).some((c) => c.toLowerCase() === filterColor.toLowerCase())
      ) {
        return false;
      }
      if (term) {
        const hay = `${item.animalName || ''} ${item.breed || ''} ${item.neighborhood || ''} ${item.city || ''} ${item.characteristics || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [
    geoCenter,
    geoResults,
    allReports,
    searchText,
    filterType,
    filterSpecies,
    filterSize,
    filterColor,
  ]);

  const selectableReferenceReports = useMemo(() => {
    const seen = new Set();
    const combined = [];
    for (const item of [...myReports, ...allReports]) {
      const id = item.reportId || item.id;
      if (!seen.has(id)) {
        seen.add(id);
        combined.push(item);
      }
    }
    return combined;
  }, [myReports, allReports]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26352B]">
            Buscar e descobrir correspondências
          </h1>
          <p className="text-sm sm:text-base text-[#6B786D] mt-1">
            Explore relatos próximos ou compare um relato específico com registros do tipo oposto.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-white border border-[#E2E9E1] self-start">
          <button
            type="button"
            onClick={() => {
              setMode('explore');
              setSearchParams({});
            }}
            className={`px-4 h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'explore' ? 'bg-[#52765A] text-white' : 'text-[#6B786D] hover:text-[#26352B]'
            }`}
          >
            Explorar relatos
          </button>
          <button
            type="button"
            onClick={() => setMode('matches')}
            className={`inline-flex items-center gap-1.5 px-4 h-10 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'matches' ? 'bg-[#52765A] text-white' : 'text-[#6B786D] hover:text-[#26352B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Possíveis correspondências
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-4 text-sm text-[#B04332]">
          {error}
        </div>
      )}

      {mode === 'explore' ? (
        <div className="space-y-6">
          {/* Filter Card */}
          <section className="bg-white border border-[#E2E9E1] rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
            <div className="grid md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-[#6B786D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar por nome, bairro, raça ou característica..."
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A]"
                />
              </div>

              <div className="md:col-span-4 flex gap-2">
                <select
                  aria-label="Região de referência"
                  onChange={handleSelectPreset}
                  value={NEIGHBORHOOD_PRESETS.find((p) => `${p.neighborhood}, ${p.city}` === geoLabel)?.id || ''}
                  className="flex-1 h-11 px-3 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-xs font-medium text-[#26352B] focus:outline-none focus:border-[#52765A]"
                >
                  <option value="">Todas as regiões</option>
                  {NEIGHBORHOOD_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.neighborhood} ({p.city})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={geoLoading}
                  onClick={handleUseCurrentGeo}
                  title="Usar minha localização aproximada"
                  className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {geoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#52765A]" />
                  ) : (
                    <Compass className="w-4 h-4 text-[#52765A]" />
                  )}
                  Perto de mim
                </button>
              </div>

              <div className="md:col-span-3">
                <select
                  aria-label="Raio de distância"
                  disabled={!geoCenter}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-xs font-medium text-[#26352B] disabled:opacity-50"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Raio: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B786D] mr-1">
                <Filter className="w-3.5 h-3.5" />
                Filtros:
              </span>

              <select
                aria-label="Filtrar por tipo"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 px-3 rounded-full bg-white border border-[#E2E9E1] text-xs font-medium text-[#26352B]"
              >
                <option value="all">Perdidos e encontrados</option>
                <option value="lost">Apenas desaparecidos</option>
                <option value="found">Apenas encontrados</option>
              </select>

              <select
                aria-label="Filtrar por espécie"
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="h-9 px-3 rounded-full bg-white border border-[#E2E9E1] text-xs font-medium text-[#26352B]"
              >
                <option value="all">Todas as espécies</option>
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por porte"
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                className="h-9 px-3 rounded-full bg-white border border-[#E2E9E1] text-xs font-medium text-[#26352B]"
              >
                <option value="all">Todos os portes</option>
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Porte {opt.label.toLowerCase()}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por cor"
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="h-9 px-3 rounded-full bg-white border border-[#E2E9E1] text-xs font-medium text-[#26352B]"
              >
                <option value="">Todas as cores</option>
                {COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs font-semibold text-[#52765A] hover:bg-[#EAF5EC] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar
              </button>
            </div>

            {geoLabel && (
              <p className="text-xs text-[#52765A] font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Ordenando por proximidade a {geoLabel} (até {radiusKm} km)
              </p>
            )}
          </section>

          {/* Explore Results */}
          {loading || geoLoading ? (
            <div className="py-12 flex items-center justify-center gap-3 text-sm text-[#6B786D]">
              <Loader2 className="w-5 h-5 animate-spin text-[#52765A]" />
              <span>Buscando relatos...</span>
            </div>
          ) : filteredExploreReports.length === 0 ? (
            <div className="bg-white border border-[#E2E9E1] rounded-2xl p-10 text-center space-y-3">
              <PawPrint className="w-8 h-8 text-[#52765A] mx-auto opacity-70" />
              <h2 className="font-display text-lg font-semibold text-[#26352B]">
                Nenhum relato corresponde a esses filtros
              </h2>
              <p className="text-sm text-[#6B786D] max-w-md mx-auto">
                Tente ampliar o raio de distância ou remover alguns filtros de cor e porte para ver mais resultados próximos.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-5 h-11 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#6B786D] tabular-nums">
                Exibindo {filteredExploreReports.length}{' '}
                {filteredExploreReports.length === 1 ? 'relato ativo' : 'relatos ativos'}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExploreReports.map((report) => (
                  <PetCard key={report.reportId || report.id} report={report} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Matches Mode */
        <div className="space-y-6">
          <section className="bg-white border border-[#E2E9E1] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="grid md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <label htmlFor="match-ref-select" className="block text-sm font-semibold text-[#26352B] mb-1.5">
                  Selecione o relato para buscar possíveis correspondências
                </label>
                <select
                  id="match-ref-select"
                  value={selectedRefId}
                  onChange={(e) => handleSelectMatchRef(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-sm text-[#26352B] focus:outline-none focus:border-[#52765A]"
                >
                  <option value="">Escolha um relato ativo...</option>
                  {selectableReferenceReports.map((item) => (
                    <option key={item.reportId || item.id} value={item.reportId || item.id}>
                      [{getReportTypeLabel(item.type)}] {getReportDisplayTitle(item)} — {item.neighborhood}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label htmlFor="match-radius" className="block text-sm font-semibold text-[#26352B] mb-1.5">
                  Raio geográfico prioritário
                </label>
                <select
                  id="match-radius"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-sm text-[#26352B] focus:outline-none focus:border-[#52765A]"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {referenceReport && (
              <div className="rounded-xl bg-[#EAF5EC] border border-[#CDE6D2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {referenceReport.photoUrls?.[0] && (
                    <img
                      src={referenceReport.photoUrls[0]}
                      alt={getReportDisplayTitle(referenceReport)}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-[#3E7B52]">
                      Buscando relatos do tipo{' '}
                      {referenceReport.type === 'lost' ? 'Encontrado' : 'Desaparecido'} próximos a:
                    </p>
                    <p className="font-display text-base font-semibold text-[#26352B]">
                      {getReportDisplayTitle(referenceReport)} · {referenceReport.neighborhood}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#6B786D] max-w-xs">
                  A proximidade geográfica vem sempre em primeiro lugar; diferenças na descrição não eliminam candidatos próximos.
                </span>
              </div>
            )}
          </section>

          {!selectedRefId ? (
            <div className="bg-white border border-[#E2E9E1] rounded-2xl p-10 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-[#52765A] mx-auto opacity-75" />
              <h2 className="font-display text-lg font-semibold text-[#26352B]">
                Escolha um relato acima para iniciar a comparação
              </h2>
              <p className="text-sm text-[#6B786D] max-w-md mx-auto">
                Comparamos distância geográfica, espécie, porte, pelagem, características marcantes e data entre relatos perdidos e encontrados.
              </p>
            </div>
          ) : matchingLoading ? (
            <div className="py-12 flex items-center justify-center gap-3 text-sm text-[#6B786D]">
              <Loader2 className="w-5 h-5 animate-spin text-[#52765A]" />
              <span>Consultando região por geohash e analisando características...</span>
            </div>
          ) : matchResults.length === 0 ? (
            <div className="bg-white border border-[#E2E9E1] rounded-2xl p-10 text-center space-y-3">
              <MapPin className="w-8 h-8 text-[#52765A] mx-auto opacity-70" />
              <h2 className="font-display text-lg font-semibold text-[#26352B]">
                Nenhuma possível correspondência encontrada até {radiusKm} km
              </h2>
              <p className="text-sm text-[#6B786D] max-w-md mx-auto">
                Experimente aumentar o raio geográfico para 25 km ou 50 km, ou verifique novamente mais tarde conforme novos relatos cheguem.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#6B786D]">
                Encontramos {matchResults.length}{' '}
                {matchResults.length === 1 ? 'possível correspondência' : 'possíveis correspondências'}{' '}
                ordenada(s) pela proximidade e sinais compatíveis.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchResults.map((candidate) => (
                  <PetCard
                    key={candidate.reportId || candidate.id}
                    report={candidate}
                    matchReasons={candidate.matchReasons}
                    onCompareAI={
                      referenceReport?.photoUrls?.[0] && candidate?.photoUrls?.[0]
                        ? (cand) => setCompareCandidate(cand)
                        : null
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AiComparisonModal
        open={Boolean(compareCandidate)}
        reportA={referenceReport}
        reportB={compareCandidate}
        onClose={() => setCompareCandidate(null)}
      />
    </div>
  );
}
