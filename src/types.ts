export enum UserRole {
  ADMIN = 'admin',
  ESTABELECIMENTO = 'estabelecimento',
  PROFISSIONAL = 'profissional',
  CLIENTE = 'cliente',
}

export enum AppointmentStatus {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export type Nicho = 'barbearia' | 'salao' | 'estetica' | 'manicure' | 'outro';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  estabelecimentoId?: string;
  estabelecimentoNome?: string;
  profissionalId?: string;
  link_personalizado?: string; // Para donos de estabelecimentos
  estabelecimentoStatus?: 'ativa' | 'inativa';
  trialStartedAt?: string;
  trialExpiresAt?: string;
  isTrialActive?: boolean;
}

export interface Plano {
  id: string;
  nome: string;
  preco: number;
  features: string[];
  ativo: boolean;
  popular: boolean;
  limite_profissionais?: number;
}

export interface Estabelecimento {
  id: string;
  nome: string;
  dono_id: string;
  dono_nome?: string;
  dono_email: string;
  nicho: Nicho;
  plano: string;
  link_personalizado: string;
  endereco: string;
  documento?: string;
  telefone?: string;
  criado_em: string;
  status: 'ativa' | 'inativa';
  foto_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  hero_image_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  services_title?: string;
  social_title?: string;
  social_subtitle?: string;
  operating_days?: number[]; // 0=Dom, 1=Seg, etc.
  start_time?: string; // "HH:MM"
  end_time?: string; // "HH:MM"
  comissao_padrao?: number;
  trial_started_at?: string;
  trial_expires_at?: string;
}

export interface TipoProfissional {
  id: string;
  estabelecimento_id: string;
  nome: string;
  percentual_comissao: number;
  created_at: string;
}

export interface Profissional {
  id: string;
  user_id?: string;
  estabelecimento_id: string;
  nome: string;
  email?: string;
  telefone?: string;
  especialidade: string;
  foto_url: string;
  ativo: boolean;
  tipo_profissional_id?: string;
  tipos_profissional?: TipoProfissional; // Para join
}

export interface Servico {
  id: string;
  estabelecimento_id: string;
  nome: string;
  preco: number;
  duracao: number; // em minutos
  imagem_url?: string;
}

export interface Cliente {
  id: string;
  estabelecimento_id?: string;
  nome: string;
  telefone: string;
  criado_em?: string;
}

export interface Agendamento {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  profissional_id: string;
  profissional_nome?: string;
  servico_id: string;
  servico_nome?: string;
  estabelecimento_id: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
  preco_cobrado?: number;
  duracao_minutos?: number;
  servicos?: { // Preço do serviço
    preco: number;
  };
  profissionais?: { // Comissão do profissional
    tipos_profissional: {
      percentual_comissao: number;
    } | null;
  };
}

export interface ProfissionalDisponibilidade {
  id?: string;
  profissional_id: string;
  data: string; // YYYY-MM-DD
  hora_inicio: string | null; // HH:MM
  hora_fim: string | null; // HH:MM
  disponivel: boolean;
}

export interface GastoSaas {
  id: string;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  user_id: string;
  created_at: string;
}

// Aliases transitórios para facilitar as fases 4 e 5

export type ProfessionalType = TipoProfissional;
