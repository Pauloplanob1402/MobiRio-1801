
export type StatusEnvio = 'PENDENTE' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADO';

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  tipo: 'FORNECEDOR' | 'UNIDADE';
  creditos_saldo: number;
  created_at: string;
}

export interface Usuario {
  id: string; // auth.uid()
  email: string;
  nome: string;
  empresa_id: string;
  created_at: string;
}

export interface Envio {
  id: string;
  solicitante_id: string; // empresa_id
  transportador_id: string | null; // empresa_id
  origem: string;
  destino: string;
  descricao: string;
  volume_tipo: string;
  status: StatusEnvio;
  created_at: string;
  data_coleta: string | null;
  data_entrega: string | null;
}

export interface MovimentoCredito {
  id: string;
  empresa_id: string;
  envio_id: string;
  quantidade: number; // +1 ou -1
  tipo: 'DEBITO' | 'CREDITO';
  created_at: string;
}
