import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  Check,
  Compass,
  Loader2,
  MapPin,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import { createReport, updateReport } from '../services/reportService.js';
import { uploadReportPhotos } from '../services/storageService.js';
import {
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  SPECIES_OPTIONS,
  VALIDATION_LIMITS,
} from '../utils/constants.js';
import {
  NEIGHBORHOOD_PRESETS,
  createFirestoreSafeId,
  findClosestNeighborhoodPreset,
  requestBrowserLocation,
} from '../utils/geo.js';

export default function ReportForm({ mode = 'lost', existingReport = null }) {
  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const isEditing = Boolean(existingReport);
  const reportType = isEditing ? existingReport.type : mode;
  const isLost = reportType === 'lost';

  const todayStr = new Date().toISOString().split('T')[0];

  const [animalName, setAnimalName] = useState(existingReport?.animalName || '');
  const [species, setSpecies] = useState(existingReport?.species || 'dog');
  const [breed, setBreed] = useState(existingReport?.breed || '');
  const [size, setSize] = useState(existingReport?.size || 'medium');
  const [colors, setColors] = useState(existingReport?.colors || ['Caramelo']);
  const [characteristics, setCharacteristics] = useState(existingReport?.characteristics || '');
  const [eventDate, setEventDate] = useState(existingReport?.eventDate || todayStr);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [neighborhood, setNeighborhood] = useState(existingReport?.neighborhood || 'Vila Madalena');
  const [city, setCity] = useState(existingReport?.city || 'São Paulo - SP');
  const [coords, setCoords] = useState({
    lat: existingReport?.lat ?? NEIGHBORHOOD_PRESETS[0].lat,
    lng: existingReport?.lng ?? NEIGHBORHOOD_PRESETS[0].lng,
  });
  const [observations, setObservations] = useState(existingReport?.observations || '');

  // Existing URLs vs newly picked File objects
  const [existingPhotoUrls, setExistingPhotoUrls] = useState(existingReport?.photoUrls || []);
  const [newFiles, setNewFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newFiles]);

  const handleToggleColor = (color) => {
    setColors((prev) => {
      if (prev.includes(color)) {
        return prev.length > 1 ? prev.filter((c) => c !== color) : prev;
      }
      if (prev.length >= VALIDATION_LIMITS.COLORS_MAX) {
        return prev;
      }
      return [...prev, color];
    });
  };

  const handlePresetChange = (e) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    const preset = NEIGHBORHOOD_PRESETS.find((p) => p.id === id);
    if (preset) {
      setNeighborhood(preset.neighborhood);
      setCity(preset.city);
      setCoords({ lat: preset.lat, lng: preset.lng });
      setGeoFeedback(`Região selecionada: ${preset.neighborhood}, ${preset.city}.`);
    }
  };

  const handleUseBrowserGeo = async () => {
    setGeoLoading(true);
    setGeoFeedback('');
    setError('');
    try {
      const pos = await requestBrowserLocation();
      setCoords(pos);
      const { preset, distanceKm } = findClosestNeighborhoodPreset(pos.lat, pos.lng);
      if (distanceKm < 25) {
        setNeighborhood(preset.neighborhood);
        setCity(preset.city);
        setSelectedPresetId(preset.id);
        setGeoFeedback(
          `Localização aproximada obtida (região próxima a ${preset.neighborhood}). Você pode ajustar o nome do bairro se preferir.`
        );
      } else {
        setGeoFeedback(
          'Localização aproximada obtida. Informe abaixo o nome do bairro e cidade de referência.'
        );
      }
    } catch (err) {
      setGeoFeedback(err instanceof Error ? err.message : 'Não foi possível obter sua localização.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const totalCount = existingPhotoUrls.length + newFiles.length + picked.length;
    if (totalCount > VALIDATION_LIMITS.PHOTOS_MAX) {
      setError(`Você pode enviar no máximo ${VALIDATION_LIMITS.PHOTOS_MAX} fotografias por relato.`);
      return;
    }

    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        setError(`O arquivo "${file.name}" não é uma imagem válida.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`A imagem "${file.name}" excede o limite de 5 MB.`);
        return;
      }
    }

    setError('');
    setNewFiles((prev) => [...prev, ...picked]);
    e.target.value = '';
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!isVerified) {
      return 'Confirme seu e-mail (ou entre com Google) antes de publicar ou editar relatos.';
    }
    if (isLost && !animalName.trim()) {
      return 'Informe o nome pelo qual o animal atende.';
    }
    if (!characteristics.trim() || characteristics.trim().length < 10) {
      return 'Descreva pelo menos algumas características físicas marcantes (mínimo 10 caracteres).';
    }
    if (!eventDate) {
      return isLost ? 'Informe a data do desaparecimento.' : 'Informe a data em que foi encontrado ou avistado.';
    }
    if (!neighborhood.trim() || neighborhood.trim().length < 2) {
      return 'Informe o bairro ou região aproximada.';
    }
    if (!city.trim() || city.trim().length < 2) {
      return 'Informe a cidade.';
    }
    if (colors.length === 0) {
      return 'Selecione pelo menos uma cor de pelagem.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validate();
    if (validationErr) {
      setError(validationErr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const targetReportId = isEditing ? existingReport.reportId : createFirestoreSafeId('rep');

      let uploadedUrls = [];
      if (newFiles.length > 0) {
        uploadedUrls = await uploadReportPhotos(newFiles, user.uid, targetReportId);
      }

      const finalPhotos = [...existingPhotoUrls, ...uploadedUrls].slice(0, VALIDATION_LIMITS.PHOTOS_MAX);

      const payload = {
        type: reportType,
        animalName: animalName.trim(),
        species,
        breed: breed.trim(),
        size,
        colors,
        characteristics: characteristics.trim(),
        photoUrls: finalPhotos,
        eventDate,
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        lat: coords.lat,
        lng: coords.lng,
        observations: observations.trim(),
      };

      if (isEditing) {
        await updateReport(targetReportId, payload, user);
      } else {
        await createReport(payload, user, targetReportId);
      }

      navigate(`/relato/${targetReportId}`);
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-[#FDF0ED] border border-[#F7D2CC] p-4 flex items-start gap-3 text-sm text-[#B04332]"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Segment 1: Animal Identification */}
      <section className="bg-white border border-[#E2E9E1] rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#26352B]">
            1. Características do animal
          </h2>
          <p className="text-sm text-[#6B786D] mt-0.5">
            Detalhes visuais ajudam vizinhos e o sistema de busca a reconhecer o animal.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="animalName" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              {isLost ? 'Nome do animal *' : 'Nome (se tiver coleira/identificação)'}
            </label>
            <input
              id="animalName"
              type="text"
              maxLength={VALIDATION_LIMITS.ANIMAL_NAME_MAX}
              value={animalName}
              onChange={(e) => setAnimalName(e.target.value)}
              placeholder={isLost ? 'Ex.: Pipoca, Nori' : 'Opcional — deixe em branco se não souber'}
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              Raça aproximada (opcional)
            </label>
            <input
              id="breed"
              type="text"
              maxLength={VALIDATION_LIMITS.BREED_MAX}
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Ex.: SRD (vira-lata), Siamês, Poodle"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <span className="block text-sm font-semibold text-[#26352B] mb-2">Espécie *</span>
            <div className="flex flex-wrap gap-2">
              {SPECIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpecies(opt.value)}
                  className={`px-4 h-11 rounded-full text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    species === opt.value
                      ? 'bg-[#52765A] text-white border-[#52765A]'
                      : 'bg-white text-[#6B786D] border-[#E2E9E1] hover:border-[#52765A]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-[#26352B] mb-2">Porte aproximado *</span>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSize(opt.value)}
                  className={`px-4 h-11 rounded-full text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    size === opt.value
                      ? 'bg-[#52765A] text-white border-[#52765A]'
                      : 'bg-white text-[#6B786D] border-[#E2E9E1] hover:border-[#52765A]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold text-[#26352B] mb-2">
            Cores da pelagem * <span className="font-normal text-[#6B786D]">(escolha até 5)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => {
              const selected = colors.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleToggleColor(color)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-[#52765A] text-white border-[#52765A]'
                      : 'bg-white text-[#6B786D] border-[#E2E9E1] hover:border-[#52765A]'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  {color}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="characteristics" className="text-sm font-semibold text-[#26352B]">
              Características marcantes *
            </label>
            <span className="text-xs text-[#6B786D] tabular-nums">
              {characteristics.length}/{VALIDATION_LIMITS.CHARACTERISTICS_MAX}
            </span>
          </div>
          <textarea
            id="characteristics"
            rows={3}
            maxLength={VALIDATION_LIMITS.CHARACTERISTICS_MAX}
            value={characteristics}
            onChange={(e) => setCharacteristics(e.target.value)}
            placeholder="Descreva manchas, cor dos olhos, coleira, cicatrizes, tipo de orelha ou comportamento."
            className="w-full p-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
          />
        </div>
      </section>

      {/* Segment 2: Photographs */}
      <section className="bg-white border border-[#E2E9E1] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#26352B]">
            2. Fotografias do animal
          </h2>
          <p className="text-sm text-[#6B786D] mt-0.5">
            Fotos nítidas facilitam o reconhecimento por vizinhos e pela comparação visual. Máximo de 5 fotos (até 5 MB cada).
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {existingPhotoUrls.map((url, idx) => (
            <div
              key={`existing-${idx}`}
              className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#E2E9E1] bg-[#EAF5EC]"
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeExistingPhoto(idx)}
                aria-label="Remover fotografia"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-[#B04332] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {filePreviews.map((preview, idx) => (
            <div
              key={`new-${idx}`}
              className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#52765A] bg-[#EAF5EC]"
            >
              <img
                src={preview}
                alt={`Nova foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeNewFile(idx)}
                aria-label="Remover nova fotografia"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-[#B04332] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {existingPhotoUrls.length + newFiles.length < VALIDATION_LIMITS.PHOTOS_MAX && (
            <label className="w-28 h-28 rounded-xl border-2 border-dashed border-[#E2E9E1] hover:border-[#52765A] bg-[#F7F9F6] hover:bg-[#EAF5EC]/50 flex flex-col items-center justify-center gap-1.5 text-[#52765A] cursor-pointer transition-colors">
              <Camera className="w-6 h-6" />
              <span className="text-xs font-semibold">Adicionar foto</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </section>

      {/* Segment 3: Date & Privacy-First Approximate Location */}
      <section className="bg-white border border-[#E2E9E1] rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#26352B]">
            3. Quando e onde aconteceu
          </h2>
          <p className="text-sm text-[#6B786D] mt-0.5">
            {isLost
              ? 'Informe a data e a região aproximada onde o animal desapareceu.'
              : 'Informe a data e a região aproximada onde o animal foi encontrado ou avistado.'}
          </p>
        </div>

        <div className="rounded-xl bg-[#F3EEE4] border border-[#E7DDD0] p-3.5 flex items-start gap-2.5 text-xs text-[#26352B]">
          <ShieldCheck className="w-4 h-4 text-[#52765A] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Para proteger sua privacidade, nunca solicitamos nem exibimos o número exato da sua residência. A localização é arredondada para a região do bairro.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="eventDate" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              {isLost ? 'Data do desaparecimento *' : 'Data do encontro ou avistamento *'}
            </label>
            <input
              id="eventDate"
              type="date"
              max={todayStr}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <div>
            <label htmlFor="presetRegion" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              Selecionar região de referência
            </label>
            <select
              id="presetRegion"
              value={selectedPresetId}
              onChange={handlePresetChange}
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            >
              <option value="">Escolha um bairro ou use localização atual</option>
              {NEIGHBORHOOD_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.neighborhood} ({preset.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={geoLoading}
            onClick={handleUseBrowserGeo}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#52765A]" />
            ) : (
              <Compass className="w-4 h-4 text-[#52765A]" />
            )}
            Usar localização aproximada atual
          </button>
          {geoFeedback && <span className="text-xs text-[#52765A]">{geoFeedback}</span>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="neighborhood" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              Bairro ou região aproximada *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#6B786D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="neighborhood"
                type="text"
                maxLength={VALIDATION_LIMITS.NEIGHBORHOOD_MAX}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex.: Vila Madalena, próximo à praça"
                className="w-full h-12 pl-10 pr-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              Cidade e estado *
            </label>
            <input
              id="city"
              type="text"
              maxLength={VALIDATION_LIMITS.CITY_MAX}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex.: São Paulo - SP"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>
        </div>
      </section>

      {/* Segment 4: Additional Observations */}
      <section className="bg-white border border-[#E2E9E1] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#26352B]">
              4. Observações adicionais
            </h2>
            <p className="text-sm text-[#6B786D] mt-0.5">
              {isLost
                ? 'Cuidados médicos, se é assustado ou orientações para quem o encontrar.'
                : 'Informe se o animal está abrigado com você ou foi apenas avistado na rua.'}
            </p>
          </div>
          <span className="text-xs text-[#6B786D] tabular-nums">
            {observations.length}/{VALIDATION_LIMITS.OBSERVATIONS_MAX}
          </span>
        </div>

        <textarea
          id="observations"
          rows={3}
          maxLength={VALIDATION_LIMITS.OBSERVATIONS_MAX}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Escreva qualquer informação adicional útil para o reencontro. Evite divulgar seu telefone ou endereço completo aqui."
          className="w-full p-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
        />
      </section>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto px-6 h-12 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing
            ? 'Salvar alterações'
            : isLost
              ? 'Publicar relato de desaparecimento'
              : 'Publicar relato de animal encontrado'}
        </button>
      </div>
    </form>
  );
}
