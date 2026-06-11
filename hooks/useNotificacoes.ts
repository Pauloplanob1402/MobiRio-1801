import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ToastData } from '../components/ToastNotificacao';

export const useNotificacoes = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const userIdRef = useRef<string | null>(null);

  const addToast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...data, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id || null;
    });

    const channel = supabase.channel('notificacoes_pedidos')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'envios',
      }, async (payload) => {
        const userId = userIdRef.current;
        if (!userId) return;
        const novo = payload.new as any;
        const antigo = payload.old as any;

        // Meu pedido foi aceito
        if (novo.solicitante_id === userId && antigo.status === 'disponivel' && novo.status === 'aceito') {
          const { data: entregador } = await supabase
            .from('usuarios').select('nome').eq('id', novo.entregador_id).single();
          addToast({
            tipo: 'aceito',
            titulo: 'Pedido aceito! 🚗',
            mensagem: `${entregador?.nome || 'Alguém'} vai buscar seu pedido.`,
          });
        }

        // Entrega que eu fiz foi confirmada
        if (novo.entregador_id === userId && antigo.status !== 'entregue' && novo.status === 'entregue') {
          addToast({
            tipo: 'entregue',
            titulo: '+1 MOVE creditado!',
            mensagem: 'Entrega confirmada com sucesso.',
          });
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [addToast]);

  return { toasts, removeToast };
};
