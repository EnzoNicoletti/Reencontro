import { auth } from './config.js';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyFirebaseError(error) {
  const raw = error?.code || error?.message || '';

  if (raw.includes('permission-denied') || raw.includes('Missing or insufficient permissions')) {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      return 'Confirme o seu e-mail antes de publicar relatos ou enviar mensagens. Você também pode entrar com o Google para verificação imediata.';
    }
    return 'Você não tem permissão para realizar esta ação ou sua sessão expirou. Tente entrar novamente.';
  }

  if (raw.includes('auth/operation-not-allowed')) {
    return 'O login por e-mail e senha ainda não foi ativado no Console do Firebase (Authentication > Sign-in method). Você pode ativá-lo lá ou usar "Entrar com Google" imediatamente.';
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found')) {
    return 'E-mail ou senha incorretos. Verifique seus dados ou recupere sua senha.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (raw.includes('auth/invalid-email')) {
    return 'Informe um endereço de e-mail válido.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.';
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return 'A janela de login foi fechada antes da conclusão.';
  }
  if (raw.includes('Quota exceeded')) {
    return 'O limite diário de uso do banco de dados foi atingido. Tente novamente amanhã.';
  }
  if (raw.includes('storage/unauthorized') || raw.includes('storage/unknown') || raw.includes('storage/bucket-not-found')) {
    return 'O Firebase Storage precisa estar ativado e com as regras configuradas no Console do Firebase para enviar imagens.';
  }

  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.';
}
