
import { Barbearia, Barbeiro, Servico, Agendamento, AppointmentStatus } from '../types';

// Mock Data
const mockBarbearias: Barbearia[] = [
  { id: '1', nome: 'Navalha de Ouro', dono_id: 'user_barbearia_1', dono_email: 'dono1@email.com', link_personalizado: 'navalha-de-ouro', endereco: 'Rua Principal, 123', criado_em: '2023-01-15T09:30:00Z', status: 'ativa' },
  { id: '2', nome: 'Corte Moderno', dono_id: 'user_barbearia_2', dono_email: 'dono2@email.com', link_personalizado: 'corte-moderno', endereco: 'Avenida Central, 456', criado_em: '2023-03-20T14:00:00Z', status: 'ativa' },
  { id: '3', nome: 'Barba & Cia', dono_id: 'user_barbearia_3', dono_email: 'dono3@email.com', link_personalizado: 'barba-cia', endereco: 'Praça da Matriz, 789', criado_em: '2023-05-10T11:45:00Z', status: 'inativa' },
];

const mockBarbeiros: Barbeiro[] = [
  { id: 'b1', barbearia_id: '1', nome: 'João Silva', especialidade: 'Corte Clássico', foto_url: 'https://picsum.photos/seed/joao/200', ativo: true },
  { id: 'b2', barbearia_id: '1', nome: 'Carlos Pereira', especialidade: 'Barba e Bigode', foto_url: 'https://picsum.photos/seed/carlos/200', ativo: true },
  { id: 'b3', barbearia_id: '2', nome: 'Miguel Souza', especialidade: 'Corte Moderno', foto_url: 'https://picsum.photos/seed/miguel/200', ativo: true },
  { id: 'b4', barbearia_id: '1', nome: 'Ricardo Alves', especialidade: 'Corte Infantil', foto_url: 'https://picsum.photos/seed/ricardo/200', ativo: false },
];

const mockServicos: Servico[] = [
  { id: 's1', barbearia_id: '1', nome: 'Corte de Cabelo', preco: 50.00, duracao: 30 },
  { id: 's2', barbearia_id: '1', nome: 'Barba', preco: 30.00, duracao: 20 },
  { id: 's3', barbearia_id: '1', nome: 'Cabelo + Barba', preco: 75.00, duracao: 50 },
  { id: 's4', barbearia_id: '2', nome: 'Corte Degradê', preco: 60.00, duracao: 45 },
];

const mockAgendamentos: Agendamento[] = [
  { id: 'a1', cliente_id: 'c1', cliente_nome: 'Fernando Lima', barbeiro_id: 'b1', barbeiro_nome: 'João Silva', servico_id: 's1', servico_nome: 'Corte de Cabelo', barbearia_id: '1', data: '2024-08-10', hora: '10:00', status: AppointmentStatus.CONFIRMADO },
  { id: 'a2', cliente_id: 'c2', cliente_nome: 'Ana Clara', barbeiro_id: 'b2', barbeiro_nome: 'Carlos Pereira', servico_id: 's2', servico_nome: 'Barba', barbearia_id: '1', data: '2024-08-10', hora: '11:00', status: AppointmentStatus.PENDENTE },
  { id: 'a3', cliente_id: 'c3', cliente_nome: 'Roberto Dias', barbeiro_id: 'b1', barbeiro_nome: 'João Silva', servico_id: 's3', servico_nome: 'Cabelo + Barba', barbearia_id: '1', data: '2024-08-11', hora: '14:00', status: AppointmentStatus.CONCLUIDO },
  { id: 'a4', cliente_id: 'c4', cliente_nome: 'Mariana Costa', barbeiro_id: 'b3', barbeiro_nome: 'Miguel Souza', servico_id: 's4', servico_nome: 'Corte Degradê', barbearia_id: '2', data: '2024-08-12', hora: '09:00', status: AppointmentStatus.CANCELADO },
];

// Mock API functions
export const api = {
  // ADMIN
  getAdminDashboardStats: async () => {
    await new Promise(res => setTimeout(res, 500));
    return {
      totalBarbearias: mockBarbearias.length,
      usuariosAtivos: 150, // mock
      totalBarbeiros: mockBarbeiros.length,
    };
  },
  getBarbearias: async () => {
    await new Promise(res => setTimeout(res, 500));
    return mockBarbearias;
  },

  // BARBEARIA
  getBarbeariaDashboardStats: async (barbeariaId: string) => {
    await new Promise(res => setTimeout(res, 500));
    return {
      totalAgendamentos: mockAgendamentos.filter(a => a.barbearia_id === barbeariaId).length,
      totalBarbeiros: mockBarbeiros.filter(b => b.barbearia_id === barbeariaId).length,
      totalClientes: 35, // mock
    };
  },
  getBarbeirosByBarbearia: async (barbeariaId: string) => {
    await new Promise(res => setTimeout(res, 500));
    return mockBarbeiros.filter(b => b.barbearia_id === barbeariaId);
  },
  getServicosByBarbearia: async (barbeariaId: string) => {
    await new Promise(res => setTimeout(res, 500));
    return mockServicos.filter(s => s.barbearia_id === barbeariaId);
  },
  getAgendamentosByBarbearia: async (barbeariaId: string) => {
    await new Promise(res => setTimeout(res, 500));
    return mockAgendamentos.filter(a => a.barbearia_id === barbeariaId);
  },
  getBarbeariaBySlug: async (slug: string) => {
    await new Promise(res => setTimeout(res, 500));
    return mockBarbearias.find(b => b.link_personalizado === slug);
  },

  // BARBEIRO
  getAgendamentosByBarbeiro: async (barbeiroId: string) => {
    await new Promise(res => setTimeout(res, 500));
    return mockAgendamentos.filter(a => a.barbeiro_id === barbeiroId);
  },

  // CLIENTE
  createAgendamento: async (agendamento: Omit<Agendamento, 'id'>) => {
    await new Promise(res => setTimeout(res, 500));
    const newAgendamento = { ...agendamento, id: `a${mockAgendamentos.length + 1}` };
    mockAgendamentos.push(newAgendamento);
    return newAgendamento;
  }
};
