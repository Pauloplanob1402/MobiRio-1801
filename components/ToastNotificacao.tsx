import React, { useEffect, useState } from 'react';
import { CheckCircle2, Truck, X } from 'lucide-react';

export interface ToastData {
  id: string;
  tipo: 'aceito' | 'entregue' | 'info';
  titulo: string;
  mensagem: string;
}

interface Props {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const ICONS = {
  aceito:   { icon: Truck,        bg: 'bg-blue-500',  text: 'text-white' },
  entregue: { icon: CheckCircle2, bg: 'bg-green-500', text: 'text-white' },
  info:     { icon: CheckCircle2, bg: 'bg-slate-950', text: 'text-white' },
};

const Toast: React.FC<{ toast: ToastData; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const { icon: Icon, bg } = ICONS[toast.tipo];

  useEffect(() => {
    // Entrada
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-remover após 4s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.id, onRemove]);

  return (
    <div className={`flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3.5 w-80 transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-900">{toast.titulo}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{toast.mensagem}</p>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="p-1 text-gray-300 hover:text-gray-500 rounded-lg transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ToastNotificacao: React.FC<Props> = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

export default ToastNotificacao;
