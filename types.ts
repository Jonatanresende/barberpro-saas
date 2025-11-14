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
}

export interface Barbeiro {
  id: string;
  barbearia_id: string;
  nome: string;
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
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
}

export interface Agendamento {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  cliente_email?: string;
  barbeiro_id: string;
  barbeiro_nome?: string;
  servico_id: string;
  servico_nome?: string;
  barbearia_id: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
}