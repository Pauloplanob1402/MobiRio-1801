
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
      const { data: profile } = await supabase
        .from('usuarios')
        .select('id, creditos, fornecedor_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        // Criar registro na tabela 'usuarios' com 12 créditos iniciais
        await supabase.from('usuarios').insert({
          id: user.id,
          nome: displayName,
          email: user.email,
          telefone: '(00) 00000-0000',
          creditos: 12
        });

        // Registrar no histórico de créditos
        await supabase.from('movimentos_credito').insert({
          usuario_id: user.id,
          quantidade: 12,
          tipo: 'CREDITO',
          envio_id: null
        });
      } else if (profile.creditos === null || profile.creditos === 0) {
        // Correção para usuários existentes que ficaram sem saldo inicial
        const { data: movements } = await supabase
          .from('movimentos_credito')
          .select('id')
          .eq('usuario_id', user.id)
          .limit(1);
        
        if (!movements || movements.length === 0) {
          await supabase.from('usuarios').update({ creditos: 12 }).eq('id', user.id);
          await supabase.from('movimentos_credito').insert({
            usuario_id: user.id,
            quantidade: 12,
            tipo: 'CREDITO',
            envio_id: null
          });
        }
      }
    } catch (err: any) {
      console.error("Erro no provisionamento de perfil:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setLoading(false); 
          if (initialSession) ensureProfile(initialSession.user);
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
        if (session) ensureProfile(session.user);
      }
    });

    return () => {
      mounted = false;
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
