
export type StatusEnvio = 'disponivel' | 'aceito' | 'em_transito' | 'entregue' | 'cancelado';

export interface Unidade {
  id: string;
  nome: string;
  created_at: string;
}

export interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco: string;
  created_at: string;
}

export interface Usuario {
  id: string; // auth.users.id
  fornecedor_id: string | null;
  nome: string;
  telefone: string;
  email: string;
  cnpj: string;
  endereco: string;
  creditos: number;
  created_at: string;
  fornecedores?: Fornecedor;
}

export interface Envio {
  id: string;
  fornecedor_id: string | null;
  unidade_id: string;
  descricao: string;
  status: StatusEnvio;
  created_at: string;
  aceito_por?: string | null;
  aceito_em?: string | null;
  solicitante_id: string;
  // Joins
  unidade?: { nome: string };
  fornecedor?: { nome_fantasia: string; endereco: string };
  aceitador?: { nome: string };
}

export interface MovimentoCredito {
  id: string;
  fornecedor_id: string | null;
  usuario_id?: string;
  envio_id: string | null;
  quantidade: number;
  tipo: 'CREDITO' | 'DEBITO';
  created_at: string;
  envios?: {
    descricao: string;
  };
}
