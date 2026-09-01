import { findMinhaEscalaVocal } from '../models/escalaVocalModel';
import { findMinhaEscalaAvulsa } from '../models/escalaAvulsaModel';
import { findMinhasParticipacoesEnsaio } from '../models/ensaioModel';

// Empurra as escalas do membro pro Google Agenda (uma via: app → Google). Cada
// evento tem um id determinístico (derivado da escala) → re-sincronizar ATUALIZA
// em vez de duplicar. Precisa de um access token válido (ver googleOAuth).

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const DURACAO_MS = 60 * 60 * 1000; // 1h por padrão

interface EventoEscala {
  id: string;
  titulo: string;
  inicio: string; // ISO
  fim: string; // ISO
}

/** id de evento válido pro Google (base32hex: só 0-9 a-f via encode hex). */
function idEvento(tipo: string, escalaId: number): string {
  return Buffer.from(`${tipo}-${escalaId}`).toString('hex');
}

function evento(tipo: string, escalaId: number, dataHora: string, titulo: string): EventoEscala {
  const inicio = new Date(dataHora);
  return {
    id: idEvento(tipo, escalaId),
    titulo,
    inicio: inicio.toISOString(),
    fim: new Date(inicio.getTime() + DURACAO_MS).toISOString(),
  };
}

/** Monta os eventos das escalas FUTURAS do membro (vocal + avulsa + ensaios). */
export async function montarEventos(membroId: number): Promise<EventoEscala[]> {
  const agora = Date.now();
  const futura = (d: string) => new Date(d).getTime() >= agora;

  const [vocais, avulsas, ensaios] = await Promise.all([
    findMinhaEscalaVocal(membroId),
    findMinhaEscalaAvulsa(membroId),
    findMinhasParticipacoesEnsaio(membroId),
  ]);

  const eventos: EventoEscala[] = [];
  for (const v of vocais) {
    if (v.status !== 'recusado' && futura(v.data_hora)) {
      eventos.push(evento('vocal', v.id, v.data_hora, `Escala (vocal) — ${v.tipo ?? 'Culto'}`));
    }
  }
  for (const a of avulsas) {
    if (a.status !== 'recusado' && futura(a.data_hora)) {
      eventos.push(evento('avulsa', a.id, a.data_hora, `Escala (${a.funcao}) — ${a.tipo ?? 'Culto'}`));
    }
  }
  for (const e of ensaios) {
    if (e.status !== 'recusado' && futura(e.data_hora)) {
      eventos.push(evento('ensaio', e.id, e.data_hora, 'Ensaio'));
    }
  }
  return eventos;
}

async function enviarEvento(accessToken: string, ev: EventoEscala): Promise<void> {
  const corpo = JSON.stringify({
    id: ev.id,
    summary: ev.titulo,
    description: 'Sincronizado do Worship Stage.',
    start: { dateTime: ev.inicio },
    end: { dateTime: ev.fim },
  });
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  // Tenta criar; se já existe (409), atualiza (PUT).
  const criar = await fetch(CAL_URL, { method: 'POST', headers, body: corpo });
  if (criar.status === 409) {
    await fetch(`${CAL_URL}/${ev.id}`, { method: 'PUT', headers, body: corpo });
  }
}

/** Sincroniza todas as escalas futuras do membro. Retorna quantos eventos. */
export async function sincronizarAgenda(accessToken: string, membroId: number): Promise<number> {
  const eventos = await montarEventos(membroId);
  for (const ev of eventos) {
    await enviarEvento(accessToken, ev);
  }
  return eventos.length;
}
