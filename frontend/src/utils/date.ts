/**
 * Formata uma data ISO (ex: vinda de cultos.data_hora) como "Domingo, 25 de Maio".
 */
export function formatDiaCompleto(isoDate: string): string {
  const date = new Date(isoDate);
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);

  // Intl devolve "domingo, 25 de maio" (minúsculo) — capitaliza cada palavra relevante
  return formatted.replace(/(^\w|de \w)/g, (match) => match.toUpperCase());
}

/**
 * Formata uma data ISO como horário "19:00".
 */
export function formatHora(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formata uma data ISO como "25/05".
 */
export function formatDiaCurto(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

/**
 * Nome do dia da semana de uma data ISO, ex: "Domingo".
 */
export function formatDiaSemana(isoDate: string): string {
  const date = new Date(isoDate);
  const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

/**
 * Rótulo relativo de uma data ISO: "Hoje", "Ontem", ou "25 de maio" pra
 * datas mais antigas. Usado pra agrupar listas por dia (ex: notificações).
 */
export function formatDataRelativa(isoDate: string): string {
  const data = new Date(isoDate);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (mesmoDia(data, hoje)) return 'Hoje';
  if (mesmoDia(data, ontem)) return 'Ontem';

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(data);
}

/**
 * Combina uma data "YYYY-MM-DD" (ex: vinda do Calendar) com uma hora
 * "HH:mm" digitada, em horário local, e devolve ISO em UTC pra mandar
 * pro back-end. `null` se algum dos dois estiver num formato inválido.
 */
export function montarDataHoraISO(data: string, hora: string): string | null {
  const partesData = data.split('-').map(Number);
  const partesHora = hora.split(':').map(Number);
  if (partesData.length !== 3 || partesHora.length !== 2) return null;
  if ([...partesData, ...partesHora].some((n) => Number.isNaN(n))) return null;

  const [ano, mes, dia] = partesData;
  const [horas, minutos] = partesHora;
  const dataHora = new Date(ano, mes - 1, dia, horas, minutos);
  if (Number.isNaN(dataHora.getTime())) return null;

  return dataHora.toISOString();
}
