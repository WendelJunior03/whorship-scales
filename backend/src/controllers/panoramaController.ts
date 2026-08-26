import { Request, Response } from 'express';
import { getPanorama } from '../models/panoramaModel';

// Ordem "natural" das funções na grade (palco): voz na frente, ritmo depois.
// Funções fora desta lista vão pro fim, em ordem alfabética.
const ORDEM_FUNCOES = [
    'Ministro',
    'Vocalista',
    'Vocal',
    'Backing vocal',
    'Violão',
    'Guitarra',
    'Baixo',
    'Teclado',
    'Bateria',
];

interface LinhaPanorama {
    culto_id: number;
    funcao: string;
    membro_id: number;
    nome: string;
}

export async function getPanoramaController(req: Request, res: Response) {
    const mes = String(req.query.mes ?? '');
    const m = /^(\d{4})-(\d{2})$/.exec(mes);
    if (!m) {
        return res.status(400).json({ message: 'Parâmetro "mes" (YYYY-MM) é obrigatório!' });
    }
    const ano = Number(m[1]);
    const mesNum = Number(m[2]);
    if (mesNum < 1 || mesNum > 12) {
        return res.status(400).json({ message: 'Mês inválido!' });
    }

    const inicio = new Date(Date.UTC(ano, mesNum - 1, 1)).toISOString();
    const fim = new Date(Date.UTC(ano, mesNum, 1)).toISOString();

    const { cultos, linhas } = await getPanorama(inicio, fim);

    // Ordena as funções (linhas) pela ordem natural + alfabética no resto.
    const funcoes = Array.from(new Set((linhas as LinhaPanorama[]).map((l) => l.funcao))).sort((a, b) => {
        const ia = ORDEM_FUNCOES.indexOf(a);
        const ib = ORDEM_FUNCOES.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b);
    });

    // celulas[funcao][cultoId] = [{ membro_id, nome }] (dedup por membro).
    const celulas: Record<string, Record<number, { membro_id: number; nome: string }[]>> = {};
    for (const f of funcoes) celulas[f] = {};
    for (const l of linhas as LinhaPanorama[]) {
        const porCulto = (celulas[l.funcao] ??= {});
        const cell = (porCulto[l.culto_id] ??= []);
        if (!cell.some((x) => x.membro_id === l.membro_id)) {
            cell.push({ membro_id: l.membro_id, nome: l.nome });
        }
    }

    return res.status(200).json({
        mes,
        cultos: cultos.map((c) => ({ id: c.id, data_hora: c.data_hora })),
        funcoes,
        celulas,
    });
}
