import type { Nicho } from '@/types';

interface ServicoExemplo {
  nome: string;
  duracao: number; // minutos
  preco: number;
}

export const SERVICOS_EXEMPLO: Record<Nicho, ServicoExemplo[]> = {
  barbearia: [
    { nome: 'Corte Masculino', duracao: 30, preco: 35 },
    { nome: 'Barba', duracao: 30, preco: 25 },
    { nome: 'Corte + Barba', duracao: 60, preco: 55 },
    { nome: 'Pigmentação', duracao: 60, preco: 70 },
    { nome: 'Hidratação Capilar', duracao: 45, preco: 50 },
    { nome: 'Sobrancelha', duracao: 15, preco: 15 },
  ],
  salao: [
    { nome: 'Corte Feminino', duracao: 60, preco: 70 },
    { nome: 'Escova', duracao: 60, preco: 60 },
    { nome: 'Hidratação', duracao: 60, preco: 80 },
    { nome: 'Coloração', duracao: 120, preco: 150 },
    { nome: 'Mechas', duracao: 180, preco: 250 },
    { nome: 'Progressiva', duracao: 180, preco: 200 },
  ],
  estetica: [
    { nome: 'Limpeza de Pele', duracao: 60, preco: 120 },
    { nome: 'Drenagem Linfática', duracao: 60, preco: 100 },
    { nome: 'Massagem Relaxante', duracao: 60, preco: 90 },
    { nome: 'Peeling', duracao: 45, preco: 80 },
    { nome: 'Microagulhamento', duracao: 90, preco: 200 },
    { nome: 'Depilação a Cera', duracao: 30, preco: 50 },
  ],
  manicure: [
    { nome: 'Manicure', duracao: 45, preco: 35 },
    { nome: 'Pedicure', duracao: 60, preco: 45 },
    { nome: 'Manicure + Pedicure', duracao: 90, preco: 70 },
    { nome: 'Gel nas Unhas', duracao: 90, preco: 100 },
    { nome: 'Alongamento', duracao: 120, preco: 130 },
    { nome: 'Nail Art', duracao: 60, preco: 60 },
  ],
  outro: [
    { nome: 'Atendimento Padrão', duracao: 60, preco: 100 },
    { nome: 'Consulta', duracao: 30, preco: 60 },
    { nome: 'Pacote Especial', duracao: 90, preco: 150 },
  ],
};

