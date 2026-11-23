import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config.js';

const MAX_REPORT_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_FILE_BYTES = 3 * 1024 * 1024;

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 64);
}

export async function uploadReportPhotos(files, userId, reportId) {
  if (!files || files.length === 0) return [];
  if (!userId || !reportId) {
    throw new Error('Identificação de usuário ou relato ausente para envio das fotos.');
  }

  const uploadedUrls = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (!file.type.startsWith('image/')) {
      throw new Error(`O arquivo "${file.name}" não é uma imagem válida.`);
    }
    if (file.size > MAX_REPORT_FILE_BYTES) {
      throw new Error(`A imagem "${file.name}" ultrapassa o limite de 5 MB.`);
    }

    const safeName = `${Date.now()}_${i}_${sanitizeFilename(file.name)}`;
    const storageRef = ref(storage, `reports/${userId}/${reportId}/${safeName}`);

    try {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const url = await getDownloadURL(snapshot.ref);
      uploadedUrls.push(url);
    } catch (err) {
      const code = err?.code || '';
      if (code.includes('storage/unauthorized')) {
        throw new Error(
          'Permissão negada no Firebase Storage. Confirme seu e-mail e verifique se as regras em storage.rules foram publicadas.'
        );
      }
      if (code.includes('storage/bucket-not-found') || code.includes('storage/unknown') || code.includes('storage/retry-limit-exceeded')) {
        throw new Error(
          'O envio de arquivos requer que o Firebase Storage esteja ativado no Console do Firebase (Storage > Começar).'
        );
      }
      throw new Error(`Falha ao enviar a foto "${file.name}": ${err?.message || 'erro desconhecido'}`);
    }
  }

  return uploadedUrls;
}

export async function uploadProfileAvatar(file, userId) {
  if (!file || !userId) {
    throw new Error('Selecione uma imagem válida.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo selecionado não é uma imagem.');
  }
  if (file.size > MAX_PROFILE_FILE_BYTES) {
    throw new Error('A foto de perfil deve ter no máximo 3 MB.');
  }

  const safeName = `${Date.now()}_${sanitizeFilename(file.name)}`;
  const storageRef = ref(storage, `profiles/${userId}/${safeName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    const code = err?.code || '';
    if (code.includes('storage/unauthorized')) {
      throw new Error('Permissão negada no Firebase Storage. Verifique a confirmação do seu e-mail e as regras do Storage.');
    }
    throw new Error(
      'Não foi possível enviar a foto de perfil. Verifique se o Firebase Storage está ativado no Console do Firebase.'
    );
  }
}
