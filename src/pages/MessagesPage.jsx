import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  Loader2,
  MessageCircle,
  PawPrint,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import {
  markIncomingMessagesAsRead,
  sendMessage,
  subscribeConversation,
  subscribeMessages,
  subscribeUserConversations,
} from '../services/chatService.js';
import { VALIDATION_LIMITS, getReportTypeLabel } from '../utils/constants.js';
import { formatMessageTimestampPtBr } from '../utils/geo.js';

export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, isVerified } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = subscribeUserConversations(
      user.uid,
      (items) => {
        setConversations(items);
        setLoadingList(false);
      },
      (err) => {
        setError(getFriendlyFirebaseError(err));
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!conversationId) {
      setActiveConv(null);
      setMessages([]);
      return undefined;
    }

    setLoadingMessages(true);
    setError('');

    const unsubConv = subscribeConversation(
      conversationId,
      (conv) => setActiveConv(conv),
      (err) => setError(getFriendlyFirebaseError(err))
    );

    const unsubMsgs = subscribeMessages(
      conversationId,
      (msgs) => {
        setMessages(msgs);
        setLoadingMessages(false);
        if (user?.uid && isVerified) {
          markIncomingMessagesAsRead(conversationId, user.uid, msgs);
        }
      },
      (err) => {
        setError(getFriendlyFirebaseError(err));
        setLoadingMessages(false);
      }
    );

    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [conversationId, user?.uid, isVerified]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getOtherParticipantName = (conv) => {
    if (!conv?.participantNames || !user?.uid) return 'Contato';
    const otherId = (conv.participantIds || []).find((id) => id !== user.uid);
    return conv.participantNames[otherId] || 'Tutor / Colaborador';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !conversationId || !user?.uid) return;
    if (!isVerified) {
      setError('Confirme seu e-mail antes de enviar mensagens.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await sendMessage(conversationId, user.uid, draft);
      setDraft('');
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-4 md:pt-8">
      <div className="grid lg:grid-cols-12 gap-5 min-h-[calc(100vh-190px)]">
        {/* Conversation Inbox List (hidden on mobile when viewing a specific thread) */}
        <section
          className={`lg:col-span-4 bg-white border border-[#E2E9E1] rounded-2xl shadow-card flex flex-col overflow-hidden ${
            conversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-[#E2E9E1]">
            <h1 className="font-display text-xl font-bold text-[#26352B]">Mensagens</h1>
            <p className="text-xs text-[#6B786D] mt-0.5">
              Conversas seguras sobre relatos de animais
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E9E1]">
            {loadingList ? (
              <div className="p-8 flex items-center justify-center gap-2 text-sm text-[#6B786D]">
                <Loader2 className="w-4 h-4 animate-spin text-[#52765A]" />
                <span>Carregando conversas...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center mx-auto">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h2 className="font-display text-base font-semibold text-[#26352B]">
                  Nenhuma conversa ainda
                </h2>
                <p className="text-xs text-[#6B786D] leading-relaxed">
                  Ao encontrar um relato compatível, toque em &ldquo;Entrar em contato&rdquo; para conversar por aqui.
                </p>
                <Link
                  to="/buscar"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-[#DCEBDD] text-[#26352B] text-xs font-semibold"
                >
                  Explorar relatos
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === conversationId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => navigate(`/mensagens/${conv.id}`)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#EAF5EC]/70' : 'hover:bg-[#F7F9F6]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#EAF5EC] shrink-0 border border-[#E2E9E1]">
                      {conv.reportPhotoUrl ? (
                        <img
                          src={conv.reportPhotoUrl}
                          alt={conv.reportTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#52765A]">
                          <PawPrint className="w-5 h-5 opacity-70" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#26352B] truncate">
                          {getOtherParticipantName(conv)}
                        </p>
                        <span className="text-[11px] text-[#6B786D] whitespace-nowrap tabular-nums">
                          {formatMessageTimestampPtBr(conv.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#52765A] truncate">
                        {getReportTypeLabel(conv.reportType)} · {conv.reportTitle}
                      </p>
                      <p className="text-xs text-[#6B786D] truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Active Conversation Thread */}
        <section
          className={`lg:col-span-8 bg-white border border-[#E2E9E1] rounded-2xl shadow-card flex flex-col overflow-hidden ${
            conversationId ? 'flex h-[calc(100vh-140px)] md:h-[680px]' : 'hidden lg:flex lg:h-[680px]'
          }`}
        >
          {!conversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="font-display text-lg font-semibold text-[#26352B]">
                Selecione uma conversa
              </h2>
              <p className="text-sm text-[#6B786D] max-w-sm">
                Escolha uma conversa ao lado para acompanhar mensagens em tempo real e combinar detalhes com segurança.
              </p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#E2E9E1] flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    to="/mensagens"
                    aria-label="Voltar para conversas"
                    className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#52765A] hover:bg-[#EAF5EC] shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  {activeConv?.reportPhotoUrl && (
                    <img
                      src={activeConv.reportPhotoUrl}
                      alt={activeConv.reportTitle}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-[#E2E9E1] shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#26352B] truncate">
                      {activeConv ? getOtherParticipantName(activeConv) : 'Conversa'}
                    </p>
                    {activeConv && (
                      <p className="text-xs text-[#52765A] truncate">
                        {getReportTypeLabel(activeConv.reportType)} · {activeConv.reportTitle}
                      </p>
                    )}
                  </div>
                </div>

                {activeConv?.reportId && (
                  <Link
                    to={`/relato/${activeConv.reportId}`}
                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    <span>Ver relato</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {/* Privacy Reminder */}
              <div className="px-4 py-2 bg-[#F3EEE4] border-b border-[#E7DDD0] flex items-center gap-2 text-[11px] text-[#6B786D]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#52765A] shrink-0" />
                <span>Combine encontros apenas em locais públicos e movimentados durante o dia.</span>
              </div>

              {error && (
                <div className="m-3 rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-3 text-xs text-[#B04332]">
                  {error}
                </div>
              )}

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F9F6]">
                {loadingMessages ? (
                  <div className="py-10 flex items-center justify-center gap-2 text-sm text-[#6B786D]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#52765A]" />
                    <span>Carregando mensagens...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-[#6B786D] py-8">
                    Envie a primeira mensagem para iniciar a conversa sobre este animal.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? 'bg-[#52765A] text-white rounded-br-xs'
                              : 'bg-white border border-[#E2E9E1] text-[#26352B] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] tabular-nums ${
                              isMine ? 'text-[#DCEBDD]' : 'text-[#6B786D]'
                            }`}
                          >
                            <span>{formatMessageTimestampPtBr(msg.createdAt)}</span>
                            {isMine && msg.readAt && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-[#E2E9E1] bg-white flex items-center gap-2.5"
              >
                <input
                  type="text"
                  maxLength={VALIDATION_LIMITS.MESSAGE_MAX}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 h-11 px-4 rounded-lg bg-[#F7F9F6] border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A]"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Enviar mensagem"
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
