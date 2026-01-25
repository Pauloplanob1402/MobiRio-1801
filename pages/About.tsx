
import React from 'react';
import { BookOpen, FileText, ShieldCheck, Users } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 font-sans pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Ajuda e Informações</h2>
        <p className="text-gray-500 mt-1 text-lg">Tudo o que você precisa saber sobre o ecossistema Mobirio.</p>
      </div>

      {/* Página 1 — COMO FUNCIONA O MOBIRIO */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Como funciona o Mobirio</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">O que é o Mobirio</p>
            <p>O Mobirio é um app de carona colaborativa entre fornecedores e unidades produtivas para o envio de amostras, envelopes, protótipos, fechamentos, reposições e pequenos volumes.</p>
            <p className="mt-2">O objetivo é simples: organizar deslocamentos que já existem, com mais agilidade, menos custo indireto e menor impacto ambiental. Nem todo pequeno volume precisa ir sozinho.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Princípios</p>
            <p>Simplicidade, agilidade, sustentabilidade e colaboração.</p>
            <p className="mt-2">O foco do Mobirio não é dinheiro. O foco é movimento organizado, colaboração e eficiência operacional.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Como funciona</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Um fornecedor ou unidade cria um envio</li>
              <li>Outro fornecedor ou unidade aceita a carona</li>
              <li>O envio segue junto em um deslocamento que já aconteceria</li>
              <li>Após a confirmação da entrega:
                <div className="mt-1 pl-2 border-l-2 border-beirario/20">
                  <span className="font-bold text-gray-900">Quem deu a carona gera 1 MOVE</span><br/>
                  <span className="font-bold text-gray-900">Quem usou a carona utiliza 1 MOVE</span>
                </div>
              </li>
            </ul>
            <p className="mt-4 italic text-beirario font-bold">MOVE não é dinheiro. MOVE é o registro de uma ação colaborativa real.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">MOVE</p>
            <p>Ao se cadastrar, cada usuário recebe automaticamente 12 MOVE iniciais.</p>
            <p className="mt-2">MOVE não é vendido, não pode ser comprado e não possui valor financeiro. Todos os registros são automáticos, transparentes e auditáveis.</p>
          </div>
        </div>
      </section>

      {/* Página 2 — QUESTÃO FISCAL, NOTAS E DOCUMENTOS */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <FileText size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Questão fiscal, notas e documentos</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">O que o Mobirio não é</p>
            <p>O Mobirio não é meio de pagamento, não intermedia valores, não cobra frete e não interfere em preços comerciais.</p>
            <p className="mt-2">Cada fornecedor ou unidade produtiva permanece totalmente responsável por suas obrigações fiscais.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Notas e documentos</p>
            <p>Cada empresa emite seus documentos normalmente. O Mobirio não substitui NF-e, NFS-e, CT-e ou qualquer documento fiscal.</p>
            <p className="mt-2">O app apenas organiza a carona logística. Se um documento já existe hoje, ele continua existindo. Se não existe, o Mobirio não cria nova obrigação.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Fornecedores concorrentes</p>
            <p>Quando fornecedores concorrentes utilizam a mesma carona colaborativa, o Mobirio recomenda:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Uso de documentação simplificada para amostras, quando permitido</li>
              <li>Valores padronizados ou fictícios, quando aplicável</li>
              <li>Evitar exposição de informações comerciais</li>
            </ul>
            <p className="mt-3">O sistema não exibe valores comerciais para terceiros.</p>
          </div>
        </div>
      </section>

      {/* Página 3 — TRANSPARÊNCIA, COLABORAÇÃO E CONCORRÊNCIA */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <Users size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Transparência, colaboração e concorrência</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Neutralidade</p>
            <p>O Mobirio é neutro. Não compara preços, não expõe dados comerciais e não interfere em negociações.</p>
            <p className="mt-2">Cada participante visualiza apenas o necessário para executar a carona.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Ambiente seguro</p>
            <p>MOVE é sempre consequência de uma entrega confirmada. Não existe manipulação manual, saldo oculto ou regra invisível.</p>
            <p className="mt-2">Tudo é registrado de forma clara e rastreável.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">MOVE não gera vantagem comercial</p>
            <p>MOVE não é dinheiro, não gera ranking financeiro e não cria benefício comercial oculto. Ele apenas mantém o equilíbrio da colaboração.</p>
          </div>
        </div>
      </section>

      {/* Página 4 — LGPD E PROTEÇÃO DE DADOS */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-400">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">LGPD e proteção de dados</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Dados utilizados</p>
            <p>O Mobirio utiliza apenas dados essenciais:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Nome da empresa</li>
              <li>Nome de contato</li>
              <li>E-mail</li>
              <li>Registros de envio e entrega</li>
            </ul>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Compromissos</p>
            <p>O Mobirio não vende dados, não compartilha dados com terceiros, não utiliza dados para publicidade e não cria perfis de comportamento.</p>
          </div>
          
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Segurança</p>
            <p>Cada usuário acessa apenas seus próprios dados. A exclusão segue a LGPD.</p>
            <p className="mt-4 italic font-bold text-gray-900 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              Princípio do sistema: Usar o mínimo de dados possível para gerar valor real.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
