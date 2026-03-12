import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Truck, 
  PackageCheck, 
  History, 
  LogOut,
  Menu,
  Wallet as WalletIcon,
  HelpCircle
} from 'lucide-react';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Usuário');
  const [fornecedorName, setFornecedorName] = useState('Parceiro Mobirio');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user && mounted) {
          const fallbackName = user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
          setUserName(fallbackName);

          // CORRIGIDO: removida referência a fornecedores que não existe mais
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('nome, nome_fantasia')
            .eq('id', user.id)
            .maybeSingle();

          if (usuario && mounted) {
            if (usuario.nome) setUserName(usuario.nome);
            if (usuario.nome_fantasia) setFornecedorName(usuario.nome_fantasia);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados do usuário no Layout:", err);
      }
    };

    fetchUserData();
    return () => { mounted = false; };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/', label: 'Painel', icon: LayoutDashboard },
    { path: '/criar', label: 'Novo Envio', icon: PackagePlus },
    { path: '/meus-envios', label: 'Minhas Atividades', icon: PackageCheck },
    { path: '/disponiveis', label: 'Caronas Disponíveis', icon: Truck },
    { path: '/historico', label: 'Histórico', icon: History },
    { path: '/carteira', label: 'Carteira', icon: WalletIcon },
    { path: '/ajuda', label: 'Ajuda e Regras', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-30 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-beirario flex items-center justify-center rounded-lg shadow-lg">
              <Truck className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mobirio</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive ? 'bg-beirario text-white shadow-md' : 'text-gray-500 hover:bg-beirario-light hover:text-beirario'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="mb-4 px-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Perfil</p>
              <p className="text-sm font-bold text-gray-900 mt-1 truncate">{userName}</p>
              <p className="text-[10px] text-beirario font-bold uppercase truncate">{fornecedorName}</p>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 hover:bg-gray-50 hover:text-red-600 rounded-xl transition-all">
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-wider">Unidades Beira Rio</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
