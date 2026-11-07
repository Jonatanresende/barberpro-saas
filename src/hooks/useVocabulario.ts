import { useMemo } from 'react';
import { vocabularioDe, type Vocabulario } from '@/config/vocabulario';
import type { Nicho } from '@/types';

/**
 * Retorna o vocabulário correto para o nicho informado.
 * Use nas telas do dono, do profissional e na página pública.
 * Para o painel admin do SaaS use o vocabulário genérico ('outro').
 *
 * @example
 *   const vocab = useVocabulario(estabelecimento.nicho);
 *   <h1>{vocab.profissional.plural}</h1> // "Barbeiros" ou "Esteticistas" etc.
 */
export const useVocabulario = (nicho?: Nicho | string): Vocabulario => {
  return useMemo(() => vocabularioDe(nicho), [nicho]);
};

export default useVocabulario;

