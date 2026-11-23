import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Compass,
  Home,
  MailCheck,
  MessageCircle,
  PawPrint,
  PlusCircle,
  Search,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { loginWithGoogle, resendVerificationEmail } from '../services/authService.js';
import { getFriendlyFirebaseError } from '../firebase/errors.js';

export default function Layout() {
  const { user, isAuthenticated, isVerified, refreshAuth } = useAuth();
  const location = useLocation();
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const isChatThread = /^\/mensagens\/.+/.test(location.pathname);

  const handleResendVerification = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      await resendVerificationEmail();
      setVerifyMsg('E-mail de confirmação reenviado. Verifique sua caixa de entrada ou spam.');
    } catch (err) {
      setVerifyMsg(getFriendlyFirebaseError(err));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      const updated = await refreshAuth();
      if (updated?.emailVerified) {
        setVerifyMsg('E-mail confirmado com sucesso!');
      } else {
        setVerifyMsg('Ainda não identificamos a confirmação. Clique no link enviado ao seu e-mail.');
      }
    } catch (err) {
      setVerifyMsg(getFriendlyFirebaseError(err));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleGoogleQuickVerify = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setVerifyMsg(getFriendlyFirebaseError(err));
    } finally {
      setVerifyLoading(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors py-1 border-b-2 ${
      isActive
        ? 'text-[#26352B] border-[#52765A] font-semibold'
        : 'text-[#6B786D] border-transparent hover:text-[#26352B]'
    }`;

  const mobileTabClass = ({ isActive }) =>
    `flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors ${
      isActive ? 'text-[#52765A] font-semibold' : 'text-[#6B786D]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F6] text-[#26352B]">
      {/* Desktop Header — Strict 3-zone Top Bar Contract */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E9E1]">
        <div className="max-w-[1200px] mx-auto px-8 h-[72px] flex items-center justify-between gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#26352B] font-display text-xl font-bold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52765A] rounded-lg"
          >
            <span className="w-8 h-8 rounded-lg bg-[#EAF5EC] text-[#52765A] flex items-center justify-center">
              <PawPrint className="w-4 h-4" />
            </span>
            <span>Reencontro</span>
          </Link>

          <nav aria-label="Navegação principal" className="flex items-center gap-7">
            <NavLink to="/" end className={navLinkClass}>
              Início
            </NavLink>
            <NavLink to="/buscar" className={navLinkClass}>
              Buscar
            </NavLink>
            <NavLink to="/reportar" className={navLinkClass}>
              Reportar
            </NavLink>
            <NavLink to="/mensagens" className={navLinkClass}>
              Mensagens
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <Link
                to="/perfil"
                className="inline-flex items-center gap-2.5 px-4 h-10 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Perfil'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[#52765A]" />
                )}
                <span className="max-w-[140px] truncate">
                  {user?.displayName || 'Minha conta'}
                </span>
              </Link>
            ) : (
              <Link
                to="/entrar"
                className="inline-flex items-center justify-center px-5 h-10 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Compact Header (<= 56px) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E9E1] h-14 px-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-[#26352B] font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
        >
          <span className="w-7 h-7 rounded-lg bg-[#EAF5EC] text-[#52765A] flex items-center justify-center">
            <PawPrint className="w-4 h-4" />
          </span>
          <span>Reencontro</span>
        </Link>

        {isAuthenticated ? (
          <Link
            to="/perfil"
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-lg bg-[#EAF5EC] text-[#26352B] text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <User className="w-3.5 h-3.5 text-[#52765A]" />
            <span className="max-w-[110px] truncate">{user?.displayName || 'Perfil'}</span>
          </Link>
        ) : (
          <Link
            to="/entrar"
            className="inline-flex items-center justify-center px-4 min-h-[40px] rounded-lg bg-[#52765A] text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            Entrar
          </Link>
        )}
      </header>

      {/* Email Verification Guidance Banner when signed in via Email/Password and unverified */}
      {isAuthenticated && !isVerified && (
        <div className="bg-[#F3EEE4] border-b border-[#E7DDD0]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-sm text-[#26352B]">
              <MailCheck className="w-5 h-5 text-[#52765A] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  Confirme seu e-mail ({user?.email}) para publicar relatos e enviar mensagens.
                </p>
                {verifyMsg && <p className="text-xs text-[#6B786D] mt-1">{verifyMsg}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={verifyLoading}
                onClick={handleCheckVerified}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Já confirmei
              </button>
              <button
                type="button"
                disabled={verifyLoading}
                onClick={handleResendVerification}
                className="px-3 py-2 rounded-lg bg-white border border-[#E2E9E1] hover:bg-[#EAF5EC] text-[#26352B] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                Reenviar e-mail
              </button>
              <button
                type="button"
                disabled={verifyLoading}
                onClick={handleGoogleQuickVerify}
                className="px-3 py-2 rounded-lg bg-[#DCEBDD] hover:bg-[#D0E3D2] text-[#26352B] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                Usar Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className={`flex-1 ${isChatThread ? 'pb-4 md:pb-10' : 'pb-20 md:pb-12'}`}>
        <Outlet />
      </main>

      {/* Quiet Footer (Desktop & non-chat pages) */}
      {!isChatThread && (
        <footer className="hidden md:block border-t border-[#E2E9E1] bg-white mt-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B786D]">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-[#52765A]" />
              <span className="font-display font-semibold text-[#26352B]">Reencontro</span>
              <span aria-hidden="true">·</span>
              <span>Comunidade de apoio a animais perdidos e encontrados</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/buscar" className="hover:text-[#26352B] transition-colors">
                Buscar relatos
              </Link>
              <Link to="/reportar/perdido" className="hover:text-[#26352B] transition-colors">
                Perdi um animal
              </Link>
              <Link to="/reportar/encontrado" className="hover:text-[#26352B] transition-colors">
                Encontrei um animal
              </Link>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Tab Bar (Hidden inside active chat thread so input stays clean) */}
      {!isChatThread && (
        <nav
          aria-label="Navegação inferior"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E9E1] pb-safe"
        >
          <div className="grid grid-cols-5 h-16 items-center px-1">
            <NavLink to="/" end className={mobileTabClass}>
              <Home className="w-5 h-5 mb-0.5" />
              <span>Início</span>
            </NavLink>
            <NavLink to="/buscar" className={mobileTabClass}>
              <Search className="w-5 h-5 mb-0.5" />
              <span>Buscar</span>
            </NavLink>
            <NavLink to="/reportar" className={mobileTabClass}>
              <PlusCircle className="w-5 h-5 mb-0.5" />
              <span>Reportar</span>
            </NavLink>
            <NavLink to="/mensagens" className={mobileTabClass}>
              <MessageCircle className="w-5 h-5 mb-0.5" />
              <span>Mensagens</span>
            </NavLink>
            <NavLink to="/perfil" className={mobileTabClass}>
              <Compass className="w-5 h-5 mb-0.5 hidden" />
              <User className="w-5 h-5 mb-0.5" />
              <span>Perfil</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}
