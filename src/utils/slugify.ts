export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/[^\w\-]+/g, '') // Remove todos os caracteres não-palavra
    .replace(/\-\-+/g, '-') // Substitui múltiplos - por um único -
    .replace(/^-+/, '') // Remove - do início
    .replace(/-+$/, ''); // Remove - do fim
};