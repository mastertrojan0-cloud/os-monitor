import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Ordens from './pages/Ordens';
import OrdemDetalhe from './pages/OrdemDetalhe';
import Auditoria from './pages/Auditoria';
import Estatisticas from './pages/Estatisticas';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/ordens" element={<Ordens />} />
        <Route path="/ordens/:id" element={<OrdemDetalhe />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
