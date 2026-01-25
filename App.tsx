
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateShipment from './pages/CreateShipment';
import AvailableShipments from './pages/AvailableShipments';
import MyShipments from './pages/MyShipments';
import History from './pages/History';
import Wallet from './pages/Wallet';
import About from './pages/About';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: any) => {
    if (!user) return;

    try {
      // Busca perfil na tabela usuarios
      const { data: profile, error: fetchError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        console.log("Perfil não encontrado, iniciando provisionamento automático...");
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        // 1. Tentar criar Fornecedor (necessário se houver FK obrigatória)
        const { data: supplier, error: supplierError } = await supabase
          .from('fornecedores')
          .insert({
            razao_social: displayName.toUpperCase(),
            nome_fantasia: displayName,
            cnpj: '00.000.000/0000-00',
            endereco: 'Pendente'
          })
          .select()
          .single();

        // 2. Criar Usuário na tabela usuarios com 12 créditos
        // Se a criação do fornecedor falhou e houver FK, isso pode falhar, 
        // mas tentamos seguir com o ID do fornecedor criado ou nulo se permitido
        await supabase.from('usuarios').insert({
          id: user.id,
          fornecedor_id: supplier?.id || null, 
          nome: displayName,
          email: user.email,
          telefone: '(00) 00000-0000',
          creditos: 12
        });

        if (supplier?.id) {
          // 3. Registrar movimento de crédito inicial apenas se houver fornecedor
          await supabase.from('movimentos_credito').insert({
            fornecedor_id: supplier.id,
            quantidade: 12,
            tipo: 'CREDITO',
            envio_id: null
          });
        }
      }
    } catch (err: any) {
      console.error("Erro silencioso no provisionamento de perfil:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          // DESTRAVAR LOADING: Executa imediatamente após obter a sessão
          setLoading(false); 
          
          if (initialSession) {
            // Processa o perfil em background para não travar a UI
            ensureProfile(initialSession.user);
          }
        }
      } catch (err: any) {
        console.error("Erro na inicialização da autenticação:", err);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) {
          ensureProfile(session.user);
        }
      }
    });

    // Timeout de segurança absoluto: 5 segundos
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beirario"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
        
        <Route element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/criar" element={<CreateShipment />} />
          <Route path="/disponiveis" element={<AvailableShipments />} />
          <Route path="/meus-envios" element={<MyShipments />} />
          <Route path="/historico" element={<History />} />
          <Route path="/carteira" element={<Wallet />} />
          <Route path="/ajuda" element={<About />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
