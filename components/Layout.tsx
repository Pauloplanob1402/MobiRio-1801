import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard, PackagePlus, Truck, PackageCheck,
  History, LogOut, Menu, Wallet as WalletIcon,
  HelpCircle, Navigation, Route, X, Coins, UserCircle
} from 'lucide-react';
import ToastNotificacao from './ToastNotificacao';
import { useNotificacoes } from '../hooks/useNotificacoes';

const menuItems = [
  { path: '/',              label: 'Painel',              icon: LayoutDashboard },
  { path: '/criar',         label: 'Preciso trazer algo', icon: PackagePlus },
  { path: '/declarar-rota', label: 'Vou passar por lá',   icon: Navigation },
  { path: '/meus-envios',   label: 'Minhas Atividades',   icon: PackageCheck },
  { path: '/disponiveis',   label: 'Pedidos disponíveis', icon: Truck },
  { path: '/rotas',         label: 'Rotas ativas',        icon: Route },
  { path: '/historico',     label: 'Histórico',           icon: History },
  { path: '/carteira',      label: 'Carteira',            icon: WalletIcon },
  { path: '/ajuda',         label: 'Ajuda',               icon: HelpCircle },
  { path: '/perfil',        label: 'Meu Perfil',           icon: UserCircle },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName]       = useState('');
  const [saldo, setSaldo]             = useState<number | null>(null);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { toasts, removeToast } = useNotificacoes();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !mounted) return;
      const fallback = user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
      setUserName(fallback);
      const { data } = await supabase.from('usuarios').select('nome, creditos').eq('id', user.id).maybeSingle();
      if (data && mounted) {
        if (data.nome) setUserName(data.nome);
        setSaldo(data.creditos ?? 0);
      }
    };
    load();
    window.addEventListener('balanceUpdated', load);
    return () => { mounted = false; window.removeEventListener('balanceUpdated', load); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(() => null);
    navigate('/login');
  };

  const initials = userName.slice(0, 2).toUpperCase() || 'MJ';
  const currentLabel = menuItems.find(m => m.path === location.pathname)?.label || 'Painel';

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Toasts */}
      <ToastNotificacao toasts={toasts} onRemove={removeToast} />

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white flex flex-col
        transition-transform duration-300 ease-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center">
              <Truck size={16} className="text-movendo" />
            </div>
            <span className="text-base font-black tracking-tight">
              <span className="text-slate-950">movendo</span>
              <span className="text-movendo">juntos</span>
            </span>
          </Link>
          <button className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${active
                  ? 'bg-movendo text-white font-semibold shadow-sm shadow-movendo/30'
                  : 'text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900'}
              `}>
                <Icon size={18} className={active ? 'text-white' : 'text-gray-400'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Saldo + perfil */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-950 rounded-xl">
            <Coins size={16} className="text-movendo shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Saldo MOVE</p>
              <p className="text-white font-black text-base leading-none">
                {saldo === null ? '—' : saldo}
                <span className="text-movendo text-xs ml-1">MOVE</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <Link to="/perfil" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-movendo-light flex items-center justify-center text-xs font-black text-gray-600 hover:text-movendo shrink-0 transition-colors" title="Editar perfil">
              {initials}
            </Link>
            <p className="text-sm font-semibold text-gray-800 truncate flex-1">{userName}</p>
            <button onClick={handleSignOut}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
              title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="h-14 bg-white border-b border-gray-100 px-4 flex items-center gap-3 lg:hidden shrink-0">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="text-sm font-black text-gray-900 uppercase tracking-wide flex-1">{currentLabel}</span>
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl">
            <Coins size={12} className="text-movendo" />
            <span className="text-white font-black text-xs">{saldo ?? '—'}</span>
            <span className="text-movendo text-[10px] font-black">MOVE</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
