import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LoginPage, RecoverPasswordPage, RegisterPage } from './pages/AuthPages.jsx';
import HomePage from './pages/HomePage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ReportDetailPage from './pages/ReportDetailPage.jsx';
import ReportFormPage from './pages/ReportFormPage.jsx';
import ReportHubPage from './pages/ReportHubPage.jsx';
import SearchMatchesPage from './pages/SearchMatchesPage.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/buscar" element={<SearchMatchesPage />} />
              <Route path="/relato/:reportId" element={<ReportDetailPage />} />

              <Route path="/entrar" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />

              <Route
                path="/reportar"
                element={
                  <ProtectedRoute>
                    <ReportHubPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportar/perdido"
                element={
                  <ProtectedRoute>
                    <ReportFormPage mode="lost" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportar/encontrado"
                element={
                  <ProtectedRoute>
                    <ReportFormPage mode="found" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editar/:reportId"
                element={
                  <ProtectedRoute>
                    <ReportFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mensagens"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mensagens/:conversationId"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
