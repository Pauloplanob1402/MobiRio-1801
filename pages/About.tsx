import React from 'react';
import { BookOpen, FileText, ShieldCheck, Users, Lock } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 font-sans pb-10">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manual do Usuário</h2>
        <p className="text-gray-500 mt-1 text-lg">Tudo o que você precisa saber sobre o ecossistema Mobirio.</p>
      </div>

      {/* Seção 1 — COMO FUNCIONA O MOBIRIO */}
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
            <p>O Mobirio é uma plataforma de logística colaborativa que organiza caronas entre fornecedores e unidades produtivas para o transporte de amostras, envelopes, protótipos, fechamentos, reposições e pequenos volumes.</p>
            <p className="mt-2">O objetivo é simples: aproveitar deslocamentos que já existem, reduzindo custos operacionais indiretos e o impacto ambiental de envios isolados. Nem todo pequeno volume precisa ir sozinho.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Princípios</p>
            <p>Simplicidade, agilidade, sustentabilidade e colaboração.</p>
            <p className="mt-2">O Mobirio não é uma plataforma comercial. É uma ferramenta de organização operacional. Seu foco é o movimento eficiente, não a geração de receita entre participantes.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Como funciona</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Um fornecedor ou unidade registra um envio no app</li>
              <li>Outro participante visualiza e aceita a carona</li>
              <li>O envio segue junto em um deslocamento que já aconteceria</li>
              <li>Após a confirmação da entrega:
                <div className="mt-1 pl-2 border-l-2 border-beirario/20">
                  <span className="font-bold text-gray-900">Quem deu a carona recebe +1 MOVE</span><br />
                  <span className="font-bold text-gray-900">Quem usou a carona utiliza -1 MOVE</span>
                </div>
              </li>
            </ul>
            <p className="mt-4 italic text-beirario font-bold">MOVE não é dinheiro. MOVE é o registro auditável de uma ação colaborativa real.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">MOVE</p>
            <p>Ao se cadastrar, cada usuário recebe automaticamente 12 MOVE iniciais para iniciar sua participação na rede.</p>
            <p className="mt-2">MOVE não é vendido, não pode ser comprado, não possui valor financeiro e não é transferível entre usuários. Todos os registros são automáticos, transparentes e auditáveis pela própria plataforma.</p>
          </div>
        </div>
      </section>

      {/* Seção 2 — FISCAL, NOTAS E DOCUMENTOS */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <FileText size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Responsabilidade fiscal e documentos</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">O que o Mobirio não é</p>
            <p>O Mobirio não é transportadora, não é operador logístico, não é meio de pagamento e não intermedia valores comerciais entre as partes.</p>
            <p className="mt-2">A plataforma organiza a carona. A responsabilidade pela mercadoria, pelos documentos fiscais e pelas obrigações legais permanece integralmente com cada empresa participante.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Notas fiscais e documentos</p>
            <p>Cada empresa emite seus próprios documentos fiscais conforme sua obrigação legal. O Mobirio não substitui NF-e, NFS-e, CT-e, DANFE ou qualquer outro documento exigido pela legislação tributária brasileira.</p>
            <p className="mt-2">Se um documento já era necessário antes do Mobirio, ele continua sendo. Se não era, o uso da plataforma não cria nenhuma nova obrigação documental.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Sigilo comercial entre concorrentes</p>
            <p>O Mobirio reconhece que fornecedores concorrentes podem compartilhar a mesma carona. Para preservar o sigilo comercial de cada empresa, recomendamos:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><span className="font-bold text-gray-800">Envelope lacrado:</span> sempre que possível, a mercadoria e seus documentos devem ser acondicionados em embalagem fechada, impedindo o acesso visual a valores, quantidades ou informações comerciais por parte de quem realiza o transporte.</li>
              <li><span className="font-bold text-gray-800">NF-e por e-mail:</span> a nota fiscal eletrônica pode ser enviada diretamente ao destinatário por e-mail, sem necessidade de documento impresso junto à mercadoria.</li>
              <li><span className="font-bold text-gray-800">Documentação simplificada:</span> para amostras sem valor comercial, utilize declaração de conteúdo simplificada, quando permitido pela legislação aplicável.</li>
              <li><span className="font-bold text-gray-800">Omissão de dados sensíveis:</span> evite expor preços, condições comerciais, volumes ou qualquer informação estratégica durante o processo de carona.</li>
            </ul>
            <p className="mt-3 text-xs bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl font-bold">
              ⚠️ O Mobirio não exibe valores comerciais para terceiros. Nenhuma informação financeira é visível na plataforma além do necessário para identificar o envio.
            </p>
          </div>
        </div>
      </section>

      {/* Seção 3 — TRANSPARÊNCIA, COLABORAÇÃO E CONCORRÊNCIA */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <Users size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Transparência, colaboração e concorrência</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Neutralidade da plataforma</p>
            <p>O Mobirio é estritamente neutro. Não compara preços, não expõe condições comerciais, não interfere em negociações e não favorece nenhum participante em detrimento de outro.</p>
            <p className="mt-2">Cada participante visualiza apenas as informações necessárias para executar a carona: nome do solicitante, endereço de coleta e destino. Nada além disso.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Conformidade com a Lei de Defesa da Concorrência</p>
            <p>O uso do Mobirio não implica qualquer forma de combinação de preços, divisão de mercado ou troca de informações concorrencialmente sensíveis entre participantes.</p>
            <p className="mt-2">A plataforma foi desenhada para que o único ponto de contato entre concorrentes seja a execução logística da carona, sem qualquer exposição de dados comerciais estratégicos, em conformidade com a Lei nº 12.529/2011 (Lei de Defesa da Concorrência).</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Ambiente seguro e auditável</p>
            <p>MOVE é sempre consequência de uma entrega confirmada por ambas as partes. Não existe manipulação manual de saldo, crédito oculto ou regra não documentada.</p>
            <p className="mt-2">Todos os registros são rastreáveis, com data, hora e participantes identificados.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">MOVE não gera vantagem comercial</p>
            <p>MOVE não é moeda, não gera ranking financeiro, não cria benefício comercial e não pode ser convertido em qualquer forma de valor monetário. Sua única função é manter o equilíbrio da colaboração dentro da rede.</p>
          </div>
        </div>
      </section>

      {/* Seção 4 — LGPD E PROTEÇÃO DE DADOS */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-400">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">LGPD e proteção de dados</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Base legal do tratamento</p>
            <p>O tratamento de dados no Mobirio é realizado com base no legítimo interesse operacional e no consentimento do usuário no momento do cadastro, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Dados coletados</p>
            <p>O Mobirio coleta e utiliza apenas os dados estritamente necessários para o funcionamento da plataforma:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nome da empresa e nome de contato</li>
              <li>Endereço de e-mail (para autenticação)</li>
              <li>Endereço operacional (para organização da carona)</li>
              <li>Registros de envio, entrega e movimentação de MOVE</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Compromissos da plataforma</p>
            <p>O Mobirio compromete-se a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Não vender, alugar ou comercializar dados pessoais</li>
              <li>Não compartilhar dados com terceiros sem consentimento explícito</li>
              <li>Não utilizar dados para fins publicitários ou criação de perfis comportamentais</li>
              <li>Garantir que cada usuário acesse apenas seus próprios dados</li>
              <li>Atender solicitações de exclusão, correção e portabilidade de dados conforme a LGPD</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Direitos do titular</p>
            <p>Conforme a LGPD, todo usuário tem direito a: confirmar a existência do tratamento, acessar seus dados, corrigir dados incorretos, solicitar a exclusão de dados desnecessários e revogar o consentimento a qualquer momento.</p>
            <p className="mt-2">Para exercer esses direitos, entre em contato com o administrador da plataforma.</p>
          </div>

          <div>
            <p className="mt-4 italic font-bold text-gray-900 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              Princípio do sistema: coletar o mínimo de dados possível para gerar o máximo de valor operacional real.
            </p>
          </div>
        </div>
      </section>

      {/* Seção 5 — RESPONSABILIDADES E LIMITAÇÕES */}
      <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-700 delay-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-beirario-light text-beirario rounded-lg flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Responsabilidades e limitações</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Responsabilidade pelo envio</p>
            <p>O Mobirio organiza a carona, mas não assume responsabilidade pelo conteúdo transportado, por avarias, extravios, atrasos ou qualquer dano decorrente do transporte.</p>
            <p className="mt-2">A responsabilidade pela integridade da mercadoria é das partes envolvidas na carona — solicitante e transportador voluntário.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Uso adequado da plataforma</p>
            <p>O Mobirio é destinado exclusivamente ao transporte de pequenos volumes no contexto operacional entre fornecedores e unidades produtivas. É vedado o uso da plataforma para transporte de cargas que exijam licenças especiais, produtos perigosos, inflamáveis, controlados ou qualquer item cuja movimentação exija documentação específica além da NF-e padrão.</p>
          </div>

          <div>
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-1">Isenção de responsabilidade comercial</p>
            <p>O Mobirio não é parte em nenhuma negociação comercial entre os participantes. Qualquer acordo, conflito ou responsabilidade de natureza comercial é exclusivo entre as empresas envolvidas, sem qualquer participação ou responsabilidade da plataforma.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
