import {
  collection,
  deleteDoc,
  doc,
  endAt,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAt,
  updateDoc,
  where,
} from 'firebase/firestore';
import { geohashQueryBounds } from 'geofire-common';
import { db } from '../firebase/config.js';
import { handleFirestoreError, OperationType } from '../firebase/errors.js';
import { VALIDATION_LIMITS, getSizeLabel, getSpeciesLabel } from '../utils/constants.js';
import { buildGeoFields, calculateDistanceKm, createFirestoreSafeId, formatDistancePtBr } from '../utils/geo.js';

const REPORTS_COLLECTION = 'reports';

function sanitizeReportPayload(input, user, reportId) {
  const geo = buildGeoFields(input.lat, input.lng);
  const colors = Array.isArray(input.colors)
    ? input.colors.map((c) => String(c).trim()).filter(Boolean).slice(0, VALIDATION_LIMITS.COLORS_MAX)
    : ['Não informada'];

  const photoUrls = Array.isArray(input.photoUrls)
    ? input.photoUrls.map((u) => String(u).trim()).filter(Boolean).slice(0, VALIDATION_LIMITS.PHOTOS_MAX)
    : [];

  return {
    reportId,
    userId: user.uid,
    authorName: (user.displayName || user.email?.split('@')[0] || 'Tutor')
      .trim()
      .slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX),
    authorPhotoURL: (user.photoURL || '').slice(0, 500),
    type: input.type === 'found' ? 'found' : 'lost',
    animalName: (input.animalName || '').trim().slice(0, VALIDATION_LIMITS.ANIMAL_NAME_MAX),
    species: ['dog', 'cat', 'other'].includes(input.species) ? input.species : 'dog',
    breed: (input.breed || '').trim().slice(0, VALIDATION_LIMITS.BREED_MAX),
    size: ['small', 'medium', 'large'].includes(input.size) ? input.size : 'medium',
    colors: colors.length > 0 ? colors : ['Não informada'],
    characteristics: (input.characteristics || '').trim().slice(0, VALIDATION_LIMITS.CHARACTERISTICS_MAX),
    photoUrls,
    eventDate: String(input.eventDate || '').slice(0, 40),
    neighborhood: (input.neighborhood || '').trim().slice(0, VALIDATION_LIMITS.NEIGHBORHOOD_MAX),
    city: (input.city || '').trim().slice(0, VALIDATION_LIMITS.CITY_MAX),
    lat: geo.lat,
    lng: geo.lng,
    geohash: geo.geohash,
    observations: (input.observations || '').trim().slice(0, VALIDATION_LIMITS.OBSERVATIONS_MAX),
  };
}

export async function createReport(input, user, explicitReportId) {
  if (!user?.uid) throw new Error('Faça login para publicar um relato.');
  const reportId = explicitReportId || createFirestoreSafeId('rep');
  const payload = {
    ...sanitizeReportPayload(input, user, reportId),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, REPORTS_COLLECTION, reportId), payload);
    return reportId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

export async function updateReport(reportId, input, user) {
  if (!user?.uid) throw new Error('Faça login para editar este relato.');
  const clean = sanitizeReportPayload(input, user, reportId);

  const updateFields = {
    animalName: clean.animalName,
    species: clean.species,
    breed: clean.breed,
    size: clean.size,
    colors: clean.colors,
    characteristics: clean.characteristics,
    photoUrls: clean.photoUrls,
    eventDate: clean.eventDate,
    neighborhood: clean.neighborhood,
    city: clean.city,
    lat: clean.lat,
    lng: clean.lng,
    geohash: clean.geohash,
    observations: clean.observations,
    authorName: clean.authorName,
    authorPhotoURL: clean.authorPhotoURL,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, REPORTS_COLLECTION, reportId), updateFields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

export async function markReportResolved(reportId) {
  try {
    await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
      status: 'resolved',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

export async function deleteReport(reportId) {
  try {
    await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}

export async function getReportById(reportId) {
  try {
    const snap = await getDoc(doc(db, REPORTS_COLLECTION, reportId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${REPORTS_COLLECTION}/${reportId}`);
    return null;
  }
}

function sortByNewest(reports) {
  return [...reports].sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });
}

export function subscribeActiveReports(callback, onError) {
  const q = query(collection(db, REPORTS_COLLECTION), where('status', '==', 'active'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sortByNewest(items));
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
    }
  );
}

export function subscribeUserReports(userId, callback, onError) {
  if (!userId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, REPORTS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sortByNewest(items));
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
    }
  );
}

// Geofire-common geohash query + exact Haversine distance filtering
export async function queryReportsByProximity({ lat, lng, radiusKm = 25, type = 'all' }) {
  const radiusM = radiusKm * 1000;
  const center = [lat, lng];
  const bounds = geohashQueryBounds(center, radiusM);
  let candidates = [];

  try {
    const snapshots = await Promise.all(
      bounds.map((b) => {
        const q = query(
          collection(db, REPORTS_COLLECTION),
          where('status', '==', 'active'),
          orderBy('geohash'),
          startAt(b[0]),
          endAt(b[1])
        );
        return getDocs(q);
      })
    );
    const seen = new Set();
    for (const snap of snapshots) {
      for (const d of snap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          candidates.push({ id: d.id, ...d.data() });
        }
      }
    }
  } catch (err) {
    // Fallback if composite index (status + geohash) is not yet created on new project
    if (err?.code === 'failed-precondition' || String(err?.message).includes('index')) {
      const snap = await getDocs(query(collection(db, REPORTS_COLLECTION), where('status', '==', 'active')));
      candidates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      handleFirestoreError(err, OperationType.LIST, REPORTS_COLLECTION);
    }
  }

  return candidates
    .filter((item) => (type === 'all' ? true : item.type === type))
    .map((item) => {
      const distanceKm = calculateDistanceKm(lat, lng, item.lat, item.lng);
      return { ...item, distanceKm };
    })
    .filter((item) => item.distanceKm !== null && item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function normalizeWords(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
}

// Matching priority strictly enforced:
// 1. Geographic proximity (primary, never eliminated by subjective description differences)
// 2. Species
// 3. Approximate size
// 4. Coat color
// 5. Distinguishing characteristics
// 6. Date and time of the report
export async function findPossibleMatches(targetReport, radiusKm = 25) {
  if (!targetReport) return [];
  const oppositeType = targetReport.type === 'lost' ? 'found' : 'lost';

  const nearbyCandidates = await queryReportsByProximity({
    lat: targetReport.lat,
    lng: targetReport.lng,
    radiusKm,
    type: oppositeType,
  });

  const targetColors = (targetReport.colors || []).map((c) => c.toLowerCase());
  const targetKeywords = new Set(normalizeWords(`${targetReport.characteristics} ${targetReport.breed}`));
  const targetDate = targetReport.eventDate ? new Date(targetReport.eventDate).getTime() : null;

  const scored = nearbyCandidates
    .filter((candidate) => candidate.reportId !== targetReport.reportId)
    .map((candidate) => {
      const reasons = [];

      // 1. Geographic proximity (heaviest priority weight)
      const dist = candidate.distanceKm ?? 999;
      reasons.push(`Aproximadamente ${formatDistancePtBr(dist)} do local informado`);
      const proximityScore = Math.max(0, 100 - dist * 3.2);

      // 2. Species (high weight, not eliminating if someone marked "other")
      let speciesScore = 0;
      if (candidate.species === targetReport.species) {
        speciesScore = 40;
        reasons.push(`Mesma espécie (${getSpeciesLabel(candidate.species)})`);
      }

      // 3. Approximate size
      let sizeScore = 0;
      if (candidate.size === targetReport.size) {
        sizeScore = 20;
        reasons.push(`Porte compatível (${getSizeLabel(candidate.size)})`);
      }

      // 4. Coat colors
      const candColors = (candidate.colors || []).map((c) => c.toLowerCase());
      const sharedColors = (candidate.colors || []).filter((c) =>
        targetColors.includes(c.toLowerCase())
      );
      let colorScore = 0;
      if (sharedColors.length > 0) {
        colorScore = Math.min(20, sharedColors.length * 10);
        reasons.push(`Pelagem semelhante (${sharedColors.join(', ')})`);
      } else if (candColors.some((c) => targetColors.some((tc) => c.includes(tc) || tc.includes(c)))) {
        colorScore = 8;
        reasons.push('Cores possivelmente próximas na descrição');
      }

      // 5. Distinguishing characteristics keywords
      const candKeywords = normalizeWords(`${candidate.characteristics} ${candidate.breed}`);
      const sharedTraits = candKeywords.filter((w) => targetKeywords.has(w));
      let traitScore = 0;
      if (sharedTraits.length > 0) {
        traitScore = Math.min(15, sharedTraits.length * 5);
        reasons.push(`Características em comum (${[...new Set(sharedTraits)].slice(0, 3).join(', ')})`);
      }

      // 6. Date proximity
      let dateScore = 0;
      if (targetDate && candidate.eventDate) {
        const candDate = new Date(candidate.eventDate).getTime();
        if (!Number.isNaN(candDate)) {
          const diffDays = Math.abs(targetDate - candDate) / (1000 * 60 * 60 * 24);
          if (diffDays <= 3) {
            dateScore = 10;
            reasons.push('Data do registro muito próxima');
          } else if (diffDays <= 14) {
            dateScore = 5;
            reasons.push('Registrado em período próximo');
          }
        }
      }

      // Keep same-species prioritized among close distances, while never eliminating close matches
      const priorityRank = proximityScore + speciesScore + sizeScore + colorScore + traitScore + dateScore;

      return {
        ...candidate,
        matchReasons: reasons,
        _priorityRank: priorityRank,
      };
    });

  // Sort strictly by proximity-led priority without exposing any invented percentage
  return scored.sort((a, b) => {
    // If one is within 3 km and the other is far, proximity stays first
    const distDiff = (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
    if (Math.abs(distDiff) > 4) return distDiff;
    return b._priorityRank - a._priorityRank;
  });
}
