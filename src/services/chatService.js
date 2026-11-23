import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { handleFirestoreError, OperationType } from '../firebase/errors.js';
import { VALIDATION_LIMITS, getReportDisplayTitle } from '../utils/constants.js';
import { createFirestoreSafeId } from '../utils/geo.js';

const CONVERSATIONS_COLLECTION = 'conversations';

export function buildConversationId(reportId, uidA, uidB) {
  const sorted = [uidA, uidB].sort();
  return `${reportId}__${sorted[0]}__${sorted[1]}`.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
}

export async function startOrGetConversation(currentUser, report) {
  if (!currentUser?.uid) throw new Error('Faça login para iniciar uma conversa.');
  if (!report?.userId || !report?.reportId) throw new Error('Relato inválido para contato.');
  if (report.userId === currentUser.uid) {
    throw new Error('Este relato pertence à sua conta.');
  }

  const conversationId = buildConversationId(report.reportId, currentUser.uid, report.userId);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  try {
    const existing = await getDoc(convRef);
    if (existing.exists()) {
      return conversationId;
    }

    const sortedIds = [currentUser.uid, report.userId].sort();
    const myName = (currentUser.displayName || currentUser.email?.split('@')[0] || 'Tutor')
      .trim()
      .slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX);
    const otherName = (report.authorName || 'Responsável')
      .trim()
      .slice(0, VALIDATION_LIMITS.DISPLAY_NAME_MAX);

    const participantNames = {
      [currentUser.uid]: myName,
      [report.userId]: otherName,
    };

    const reportTitle = getReportDisplayTitle(report).slice(0, 120);

    await setDoc(convRef, {
      conversationId,
      reportId: report.reportId,
      reportTitle,
      reportType: report.type === 'found' ? 'found' : 'lost',
      reportPhotoUrl: (report.photoUrls?.[0] || '').slice(0, 500),
      participantIds: sortedIds,
      participantNames,
      lastMessage: 'Conversa iniciada sobre este relato.',
      lastSenderId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return conversationId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${CONVERSATIONS_COLLECTION}/${conversationId}`);
  }
}

export function subscribeUserConversations(userId, callback, onError) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
          const tb = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
          return tb - ta;
        });
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, CONVERSATIONS_COLLECTION);
    }
  );
}

export function subscribeConversation(conversationId, callback, onError) {
  if (!conversationId) {
    callback(null);
    return () => {};
  }
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  return onSnapshot(
    convRef,
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, `${CONVERSATIONS_COLLECTION}/${conversationId}`);
    }
  );
}

export function subscribeMessages(conversationId, callback, onError) {
  if (!conversationId) {
    callback([]);
    return () => {};
  }

  const messagesCol = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
  return onSnapshot(
    messagesCol,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
          return ta - tb;
        });
      callback(items);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, `${CONVERSATIONS_COLLECTION}/${conversationId}/messages`);
    }
  );
}

// Atomic writeBatch: creates message AND updates parent conversation updatedAt & lastMessage
export async function sendMessage(conversationId, senderId, rawContent) {
  const content = (rawContent || '').trim().slice(0, VALIDATION_LIMITS.MESSAGE_MAX);
  if (!content) throw new Error('Digite uma mensagem antes de enviar.');
  if (!conversationId || !senderId) throw new Error('Conversa ou usuário inválido.');

  const messageId = createFirestoreSafeId('msg');
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const msgRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', messageId);

  const batch = writeBatch(db);
  batch.set(msgRef, {
    messageId,
    conversationId,
    senderId,
    content,
    createdAt: serverTimestamp(),
    readAt: null,
  });
  batch.update(convRef, {
    lastMessage: content.slice(0, 500),
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return messageId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${CONVERSATIONS_COLLECTION}/${conversationId}/messages/${messageId}`);
  }
}

export async function markIncomingMessagesAsRead(conversationId, currentUserId, messages) {
  if (!conversationId || !currentUserId || !Array.isArray(messages)) return;
  const unread = messages.filter((m) => m.senderId !== currentUserId && !m.readAt);
  if (unread.length === 0) return;

  await Promise.all(
    unread.slice(0, 10).map((m) =>
      updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', m.id), {
        readAt: serverTimestamp(),
      }).catch(() => {})
    )
  );
}
