/**
 * Formata progressivamente como (DDD) 90000-0000 enquanto o usuário digita,
 * descartando tudo que não for número e limitando a 11 dígitos (DDD + 9).
 */
export function formatTelefone(value: string): string {
  const digitos = value.replace(/\D/g, '').slice(0, 11);

  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  if (digitos.length <= 7) return `(${ddd}) ${digitos.slice(2)}`;

  return `(${ddd}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}
