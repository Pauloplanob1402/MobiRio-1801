import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import CreateShipment from './pages/CreateShipment';
import AvailableShipments from './pages/AvailableShipments';
import AvailableRoutes from './pages/AvailableRoutes';
import DeclareRoute from './pages/DeclareRoute';
import MyShipments from './pages/MyShipments';
import History from './pages/History';
import Wallet from './pages/Wallet';
import About from './pages/About';
import Profile from './pages/Profile';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [session, setSession]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [isNew, setIsNew]       = useState(false);

  const ensureProfile = async (user: any) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('usuarios').select('id, creditos, fornecedor_id').eq('id', user.id).maybeSingle();

      if (!profile) {
        const displayName = user.user_metadata?.nome || user.user_metadata?.full_name || user.email.split('@')[0];
        await supabase.from('usuarios').insert({
          id: user.id, fornecedor_id: user.id,
          nome: displayName, email: user.email,
          telefone: '(00) 00000-0000', creditos: 12,
        });
        await supabase.from('movimentos_credito').insert({
          usuario_id: user.id, quantidade: 12, tipo: 'CREDITO', envio_id: null
        });
        // Marcar como novo usuário (para redirecionar ao onboarding)
        setIsNew(true);
      } else {
        let updates: any = {};
        if (!profile.fornecedor_id) updates.fornecedor_id = user.id;
        if (!profile.creditos) {
          const { data: mv } = await supabase.from('movimentos_credito').select('id').eq('usuario_id', user.id).limit(1);
          if (!mv?.length) {
            updates.creditos = 12;
            await supabase.from('movimentos_credito').insert({ usuario_id: user.id, quantidade: 12, tipo: 'CREDITO', envio_id: null });
          }
        }
        if (Object.keys(updates).length) await supabase.from('usuarios').update(updates).eq('id', user.id);
      }
    } catch (err) {
      console.error('ensureProfile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(s);
          setLoading(false);
          if (s) await ensureProfile(s.user);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (mounted) {
        setSession(s);
        if (s) await ensureProfile(s.user);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-movendo" />
    </div>
  );

  // Verificar se onboarding já foi visto
  const onboardingDone = localStorage.getItem('mj_onboarding_done') === '1';

  return (
    <HashRouter>
      <Routes>
        <Route path="/login"      element={!session ? <Login />      : <Navigate to="/" />} />
        <Route path="/register"   element={!session ? <Register />   : <Navigate to="/" />} />
        <Route path="/onboarding" element={session  ? <Onboarding /> : <Navigate to="/login" />} />

        <Route element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={
            session && (isNew || !onboardingDone)
              ? <Navigate to="/onboarding" />
              : <Dashboard />
          } />
          <Route path="/criar"          element={<CreateShipment />} />
          <Route path="/declarar-rota"  element={<DeclareRoute />} />
          <Route path="/meus-envios"    element={<MyShipments />} />
          <Route path="/disponiveis"    element={<AvailableShipments />} />
          <Route path="/rotas"          element={<AvailableRoutes />} />
          <Route path="/historico"      element={<History />} />
          <Route path="/carteira"       element={<Wallet />} />
          <Route path="/ajuda"          element={<About />} />
          <Route path="/perfil"         element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
