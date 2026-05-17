import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, carregando } = useAuth();

  if (carregando) return <Loading full />;
  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
