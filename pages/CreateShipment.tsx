
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Package, MapPin, FileText, Send, CheckCircle } from 'lucide-react';

const CreateShipment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [empresaId, setEmpresaId] = useState('');
  const [formData, setFormData] = useState({
    descricao: '',
    origem: '',
    destino: '',
    volume_tipo: 'CAIXA_PEQUENA',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', user.id)
          .single();
        if (usuario) setEmpresaId(usuario.empresa_id);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('envios')
      .insert({
        solicitante_id: empresaId,
        descricao: formData.descricao,
        origem: formData.origem,
        destino: formData.destino,
        volume_tipo: formData.volume_tipo,
        status: 'PENDENTE'
      });

    if (error) {
      alert('Erro ao criar envio: ' + error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/meus-envios'), 2000);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Envio Solicitado!</h2>
        <p className="text-gray-500">Sua solicitação foi enviada para a rede de caronas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Novo Envio</h2>
        <p className="text-gray-500 mt-1">Preencha os detalhes do volume para solicitar uma carona.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição do Volume</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
              <textarea 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all min-h-[100px]"
                placeholder="Ex: Amostras de couro, 3 pares de protótipos..."
                required
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Origem</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all"
                  placeholder="Ex: Fornecedor ABC"
                  required
                  value={formData.origem}
                  onChange={(e) => setFormData({...formData, origem: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Destino</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all"
                  placeholder="Ex: Unidade Beira Rio 20"
                  required
                  value={formData.destino}
                  onChange={(e) => setFormData({...formData, destino: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Volume</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['CAIXA_P', 'CAIXA_M', 'CAIXA_G', 'ENVELOPE'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({...formData, volume_tipo: tipo})}
                  className={`
                    py-3 px-4 rounded-xl border font-medium text-xs transition-all
                    ${formData.volume_tipo === tipo 
                      ? 'bg-beirario border-beirario text-white' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-beirario hover:text-beirario'}
                  `}
                >
                  {tipo.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-beirario/10 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {loading ? 'Processando...' : 'Solicitar Carona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShipment;
