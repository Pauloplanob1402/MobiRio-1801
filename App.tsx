
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
      // 1. Verificar se o registro na tabela 'usuarios' já existe
      const { data: profile } = await supabase
        .from('usuarios')
        .select('id, creditos')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        console.log("Provisionando perfil para:", user.email);
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        
        // 2. Tentar criar Fornecedor (opcional para o login, mas útil para o fluxo)
        let supplierId = null;
        try {
          const { data: supplier } = await supabase
            .from('fornecedores')
            .insert({
              razao_social: displayName.toUpperCase(),
              nome_fantasia: displayName,
              cnpj: '00.000.000/0000-00',
              endereco: 'Pendente'
            })
            .select()
            .single();
          
          if (supplier) supplierId = supplier.id;
        } catch (sErr) {
          console.warn("Falha ao criar fornecedor, tentando criar usuário sem vínculo...", sErr);
        }

        // 3. Criar Usuário na tabela 'usuarios' com 12 créditos iniciais
        const { error: userError } = await supabase.from('usuarios').insert({
          id: user.id,
          fornecedor_id: supplierId,
          nome: displayName,
          email: user.email,
          telefone: '(00) 00000-0000',
          creditos: 12
        });

        if (userError) throw userError;

        if (supplierId) {
          // 4. Registrar movimento de crédito inicial no histórico
          await supabase.from('movimentos_credito').insert({
            fornecedor_id: supplierId,
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
          // Destrava o loading imediatamente após a resposta do Auth
          setLoading(false); 
          
          if (initialSession) {
            // Garante o perfil em background
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

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
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
