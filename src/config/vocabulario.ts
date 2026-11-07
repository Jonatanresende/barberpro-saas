import type { Nicho } from '@/types';

export interface Termo {
  singular: string;
  plural: string;
  artigo: 'o' | 'a';
}

export interface Vocabulario {
  estabelecimento: Termo;
  profissional: Termo;
  tituloAgendamento: string;
}

export const VOCABULARIO: Record<Nicho, Vocabulario> = {
  barbearia: {
    estabelecimento: { singular: 'Barbearia',  plural: 'Barbearias', artigo: 'a' },
    profissional:    { singular: 'Barbeiro',   plural: 'Barbeiros',  artigo: 'o' },
    tituloAgendamento: 'Agende seu horário',
  },
  salao: {
    estabelecimento: { singular: 'Salão',       plural: 'Salões',        artigo: 'o' },
    profissional:    { singular: 'Profissional', plural: 'Profissionais', artigo: 'o' },
    tituloAgendamento: 'Agende seu horário',
  },
  estetica: {
    estabelecimento: { singular: 'Estúdio',     plural: 'Estúdios',     artigo: 'o' },
    profissional:    { singular: 'Esteticista', plural: 'Esteticistas', artigo: 'a' },
    tituloAgendamento: 'Agende seu atendimento',
  },
  manicure: {
    estabelecimento: { singular: 'Espaço',   plural: 'Espaços',   artigo: 'o' },
    profissional:    { singular: 'Manicure', plural: 'Manicures', artigo: 'a' },
    tituloAgendamento: 'Agende seu horário',
  },
  outro: {
    estabelecimento: { singular: 'Estabelecimento', plural: 'Estabelecimentos', artigo: 'o' },
    profissional:    { singular: 'Profissional',    plural: 'Profissionais',    artigo: 'o' },
    tituloAgendamento: 'Agende seu horário',
  },
};

export const vocabularioDe = (nicho?: Nicho | string): Vocabulario =>
  VOCABULARIO[(nicho as Nicho) ?? 'outro'] ?? VOCABULARIO.outro;

