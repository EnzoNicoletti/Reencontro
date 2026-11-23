import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Mail, PawPrint } from 'lucide-react';
import { getFriendlyFirebaseError } from '../firebase/errors.js';
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  sendPasswordReset,
} from '../services/authService.js';

function GoogleButton({ onClick, loading }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="w-full h-12 rounded-lg bg-white border border-[#E2E9E1] hover:bg-[#EAF5EC]/60 text-[#26352B] text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.09.73-2.48 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.13H1.03v3.14C3.04 21.14 7.21 24 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.03 14.02A7.18 7.18 0 0 1 4.65 12c0-.7.12-1.38.38-2.02V6.84H1.03A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.03 5.16l4-3.14Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.04 2.86 1.03 6.84l4 3.14C6.01 6.94 8.76 4.75 12 4.75Z"
        />
      </svg>
      <span>Entrar com Google</span>
    </button>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Preencha seu e-mail e sua senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 md:py-16">
      <div className="bg-white border border-[#E2E9E1] rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center mx-auto">
            <PawPrint className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#26352B]">Entrar no Reencontro</h1>
          <p className="text-sm text-[#6B786D]">
            Acesse sua conta para publicar relatos e conversar com segurança.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-3.5 flex items-start gap-2.5 text-xs text-[#B04332]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-[#26352B]">
                Senha
              </label>
              <Link
                to="/recuperar-senha"
                className="text-xs font-semibold text-[#52765A] hover:text-[#425E48]"
              >
                Esqueci minha senha
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Entrar
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[#E2E9E1]" />
          <span className="shrink mx-3 text-xs text-[#6B786D]">ou</span>
          <div className="flex-grow border-t border-[#E2E9E1]" />
        </div>

        <GoogleButton onClick={handleGoogle} loading={loading} />

        <p className="text-center text-sm text-[#6B786D]">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-[#52765A] hover:text-[#425E48]">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Informe seu nome ou apelido.');
      return;
    }
    if (!email.trim()) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerWithEmail({ name, email, password, city });
      navigate('/perfil', { replace: true });
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 md:py-14">
      <div className="bg-white border border-[#E2E9E1] rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center mx-auto">
            <PawPrint className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#26352B]">Criar conta no Reencontro</h1>
          <p className="text-sm text-[#6B786D]">
            Seus contatos acontecem pelo chat interno, preservando sua privacidade.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-3.5 flex items-start gap-2.5 text-xs text-[#B04332]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              Nome completo ou como prefere ser chamado *
            </label>
            <input
              id="reg-name"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Mariana Silva"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <div>
            <label htmlFor="reg-city" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              Cidade (opcional)
            </label>
            <input
              id="reg-city"
              type="text"
              maxLength={100}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex.: São Paulo - SP"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-semibold text-[#26352B] mb-1.5">
              E-mail *
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-pass" className="block text-sm font-semibold text-[#26352B] mb-1.5">
                Senha *
              </label>
              <input
                id="reg-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
              />
            </div>

            <div>
              <label htmlFor="reg-pass-confirm" className="block text-sm font-semibold text-[#26352B] mb-1.5">
                Confirmar senha *
              </label>
              <input
                id="reg-pass-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar minha conta
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[#E2E9E1]" />
          <span className="shrink mx-3 text-xs text-[#6B786D]">ou</span>
          <div className="flex-grow border-t border-[#E2E9E1]" />
        </div>

        <GoogleButton onClick={handleGoogle} loading={loading} />

        <p className="text-center text-sm text-[#6B786D]">
          Já possui uma conta?{' '}
          <Link to="/entrar" className="font-semibold text-[#52765A] hover:text-[#425E48]">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Informe o e-mail da sua conta.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 md:py-16">
      <div className="bg-white border border-[#E2E9E1] rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EC] text-[#52765A] flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#26352B]">Recuperar senha</h1>
          <p className="text-sm text-[#6B786D]">
            Enviaremos um link seguro para você redefinir sua senha.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[#FDF0ED] border border-[#F7D2CC] p-3.5 flex items-start gap-2.5 text-xs text-[#B04332]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {sent ? (
          <div className="rounded-xl bg-[#EAF5EC] border border-[#CDE6D2] p-4 space-y-3 text-sm text-[#26352B]">
            <div className="flex items-center gap-2 font-semibold text-[#3E7B52]">
              <CheckCircle2 className="w-5 h-5" />
              <span>Solicitação enviada</span>
            </div>
            <p className="text-xs text-[#6B786D] leading-relaxed">
              Se existir uma conta associada a <strong>{email}</strong>, você receberá as instruções para criar uma nova senha em alguns minutos.
            </p>
            <Link
              to="/entrar"
              className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-xs font-semibold transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="recover-email" className="block text-sm font-semibold text-[#26352B] mb-1.5">
                E-mail cadastrado
              </label>
              <input
                id="recover-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full h-12 px-4 rounded-lg bg-white border border-[#E2E9E1] text-sm text-[#26352B] placeholder:text-[#6B786D] focus:outline-none focus:border-[#52765A] focus:ring-3 focus:ring-[#52765A]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar link de recuperação
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#6B786D]">
          <Link to="/entrar" className="font-semibold text-[#52765A] hover:text-[#425E48]">
            Voltar para entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
