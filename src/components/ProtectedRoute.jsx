import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-16 flex justify-center">
        <div className="flex items-center gap-3 text-sm text-[#6B786D]">
          <div className="w-5 h-5 rounded-full border-2 border-[#52765A] border-t-transparent animate-spin" />
          <span>Verificando sua sessão...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  return children;
}
