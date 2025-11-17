export enum UserRole {
  ADMIN = 'admin',
  BARBEARIA = 'barbearia',
  BARBEIRO = 'barbeiro',
  CLIENTE = 'cliente',
}

export enum AppointmentStatus {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  CONCLUIDO = 'concluído',
  CANCELADO = 'cancelado',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  barbeariaId?: string;
  barbeariaNome?: string;
  barbeiroId?: string;
  link_personalizado?: string; // For barbershop owners
}

export interface Plano {
  id: string;
  nome: string;
  preco: number;
  features: string[];
  ativo: boolean;
  popular: boolean;
  limite_barbeiros?: number;
}

export interface Barbearia {
  id: string;
  nome: string;
  dono_id: string;
  dono_nome?: string;
  dono_email: string;
  plano: string; // Changed from enum to string to support dynamic plans
  link_personalizado: string;
  endereco: string;
  documento?: string;
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
}

export interface Barbeiro {
  id: string;
  user_id?: string;
  barbearia_id: string;
  nome: string;
  email?: string;
  telefone?: string;
  especialidade: string;
  foto_url: string;
  ativo: boolean;
}

export interface Servico {
  id: string;
  barbearia_id: string;
  nome: string;
  preco: number;
  duracao: number; // in minutes
  imagem_url?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
}

export interface Agendamento {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  barbeiro_id: string;
  barbeiro_nome?: string;
  servico_id: string;
  servico_nome?: string;
  barbearia_id: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
  servicos?: { // Adicionado para buscar o preço
    preco: number;
  };
}

export interface BarbeiroDisponibilidade {
  id?: string;
  barbeiro_id: string;
  data: string; // YYYY-MM-DD
  hora_inicio: string | null; // HH:MM
  hora_fim: string | null; // HH:MM
  disponivel: boolean;
}