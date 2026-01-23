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
import Layout from './components/Layout';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Função para garantir que o usuário tenha um perfil de fornecedor e usuário vinculado
  const ensureProfile = async (user: any) => {
    if (!user) return;

    try {
      // Verifica se já existe um registro na tabela usuarios para este ID de autenticação
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // Se não houver perfil, cria a estrutura básica necessária
      if (!profile) {
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        // 1. Cria o registro do Fornecedor
        const { data: supplier, error: sErr } = await supabase
          .from('fornecedores')
          .insert({
            razao_social: displayName.toUpperCase(),
            nome_fantasia: displayName,
            cnpj: '00.000.000/0000-00',
            endereco: 'Endereço pendente de atualização'
          })
          .select()
          .single();

        if (supplier) {
          // 2. Cria o registro do Usuário vinculado ao fornecedor
          // Isso disparará o trigger do banco que concede os 12 MOVE iniciais
          await supabase.from('usuarios').insert({
            id: user.id,
            fornecedor_id: supplier.id,
            nome: displayName,
            email: user.email,
            telefone: '(00) 00000-0000'
          });
        }
      }
    } catch (err) {
      console.error("Erro ao provisionar perfil:", err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        await ensureProfile(initialSession.user);
      }
      
      setSession(initialSession);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await ensureProfile(session.user);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;