import { Request, Response } from 'express';
import * as model from '../models/musicaModel';
import { resolverCapaMusica } from '../utils/capaMusica';
import { buscarMetadadosMusica } from '../utils/metadadosMusica';

function validarBpm(bpm: unknown): { ok: true; valor: number | null } | { ok: false } {
    if (bpm === undefined || bpm === null || bpm === '') {
        return { ok: true, valor: null };
    }
    const n = Number(bpm);
    if (Number.isNaN(n) || n < 20 || n > 400) {
        return { ok: false };
    }
    return { ok: true, valor: Math.round(n) };
}

/** Texto opcional → trim ou null (usado em artista/cifra_url/audio_url). */
function textoOuNull(v: unknown): string | null {
    return typeof v === 'string' && v.trim() ? v.trim() : null;
}

async function montarInput(body: Record<string, unknown>, bpm: number | null): Promise<model.MusicaInput> {
    const audioUrl = textoOuNull(body.audioUrl);
    // Capa: se o front já mandou uma explícita (ex.: escolhida na busca automática
    // por nome), usa ela. Senão, tenta derivar do link de áudio (YouTube/Spotify).
    const capaExplicita = textoOuNull(body.capaUrl);
    return {
        nome: String(body.nome).trim(),
        tomPadrao: textoOuNull(body.tomPadrao),
        bpm,
        artista: textoOuNull(body.artista),
        cifraUrl: textoOuNull(body.cifraUrl),
        audioUrl,
        capaUrl: capaExplicita ?? (await resolverCapaMusica(audioUrl)),
    };
}

export async function criarMusicaController(req: Request, res: Response) {
    const { nome, bpm } = req.body;
    if (!nome || !String(nome).trim()) {
        return res.status(400).json({ message: 'Nome da música é obrigatório!' });
    }
    const b = validarBpm(bpm);
    if (!b.ok) {
        return res.status(400).json({ message: 'BPM inválido (entre 20 e 400).' });
    }
    const musica = await model.criarMusica(await montarInput(req.body, b.valor));
    return res.status(201).json(musica);
}

/** GET /musicas/buscar-metadados — sugestão de artista/capa/tom/bpm pelo nome (antes de /:id). */
export async function buscarMetadadosController(req: Request, res: Response) {
    const nome = typeof req.query.nome === 'string' ? req.query.nome.trim() : '';
    if (!nome) {
        return res.status(400).json({ message: 'Informe o nome da música.' });
    }
    const artista = typeof req.query.artista === 'string' ? req.query.artista.trim() : undefined;
    const metadados = await buscarMetadadosMusica(nome, artista || undefined);
    return res.status(200).json(metadados);
}

export async function listarMusicasController(_req: Request, res: Response) {
    return res.status(200).json(await model.listarMusicas());
}

/** GET /musicas/artistas — agregação por artista (antes de /:id). */
export async function listarArtistasController(_req: Request, res: Response) {
    return res.status(200).json(await model.listarArtistas());
}

export async function getMusicaController(req: Request, res: Response) {
    const musica = await model.buscarMusica(Number(req.params.id));
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    return res.status(200).json(musica);
}

export async function atualizarMusicaController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { nome, bpm } = req.body;
    if (!nome || !String(nome).trim()) {
        return res.status(400).json({ message: 'Nome da música é obrigatório!' });
    }
    const b = validarBpm(bpm);
    if (!b.ok) {
        return res.status(400).json({ message: 'BPM inválido (entre 20 e 400).' });
    }
    const musica = await model.atualizarMusica(id, await montarInput(req.body, b.valor));
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    return res.status(200).json(musica);
}

export async function apagarMusicaController(req: Request, res: Response) {
    const musica = await model.apagarMusica(Number(req.params.id));
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }
    return res.status(200).json({ message: 'Música removida com sucesso!' });
}
