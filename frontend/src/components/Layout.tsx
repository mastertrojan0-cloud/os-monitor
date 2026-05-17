import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FlagVE, FlagBR } from './Flags';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => api.get('/alertas').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const totalAlertas = alertas?.total || 0;
  const criticos = alertas?.alertas?.filter((a: any) => a.nivel === 'CRITICO').length || 0;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded text-sm font-medium transition-colors ${
      isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="flex h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gray-900 flex flex-col transition-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-wide">OS Monitor</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/dashboard" className={linkClass} onClick={() => setSidebarOpen(false)}>
            <span className="flex items-center justify-between">
              Dashboard
              {totalAlertas > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${criticos > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {totalAlertas}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/clientes" className={linkClass} onClick={() => setSidebarOpen(false)}>Clientes</NavLink>
          <NavLink to="/ordens" className={linkClass} onClick={() => setSidebarOpen(false)}>Ordens de Serviço</NavLink>
          <div className="border-t border-gray-700 my-2" />
          <NavLink to="/auditoria" className={linkClass} onClick={() => setSidebarOpen(false)}>Auditoria</NavLink>
          <NavLink to="/estatisticas" className={linkClass} onClick={() => setSidebarOpen(false)}>Estatísticas</NavLink>
          <div className="border-t border-gray-700 my-2" />
          <NavLink to="/usuarios" className={linkClass} onClick={() => setSidebarOpen(false)}>Usuários</NavLink>
        </nav>

        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-400 truncate">{usuario?.nome}</span>
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sair</button>
        </div>

        <div className="px-4 py-2 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
            <FlagVE /><FlagBR />
            © Antonio M.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-2xl">&#9776;</button>
          <h1 className="font-semibold text-gray-800">OS Monitor</h1>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
