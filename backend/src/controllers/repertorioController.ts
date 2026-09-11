import { Request, Response } from 'express';
import { createRepertorio, findAllRepertorios, findRepertorioById, deleteRepertorio } from '../models/repertorioModel';
import { criarMusica, buscarMusicaPorNome } from '../models/musicaModel';
import { findProximoCultoDoMembro } from '../models/escalaVocalModel';
import { findProximoCultoAvulsaDoMembro } from '../models/escalaAvulsaModel';
import { resolverCapaMusica } from '../utils/capaMusica';
import { buscarMetadadosMusica } from '../utils/metadadosMusica';

/**
 * Acha (por nome, sem duplicar) ou cria a música correspondente na Biblioteca —
 * reaproveita o link já colado no Repertório (capa + áudio) e a busca de artista
 * por nome (iTunes) que a Biblioteca já usa. Best-effort: se algo falhar aqui, o
 * item do Repertório ainda é criado (só sem o vínculo).
 *
 * `linkMusica` é opcional agora (ver createRepertorioController): quando não vem
 * preenchido, o link do Spotify já buscado nos metadados serve de áudio, então a
 * música da Biblioteca não fica sem link também.
 */
async function acharOuCriarMusicaDoRepertorio(nome: string, tom: string, linkMusica: string | null): Promise<number | null> {
    try {
        const existente = await buscarMusicaPorNome(nome);
        if (existente) return existente.id;

        const [capaDoLink, metadados] = await Promise.all([
            resolverCapaMusica(linkMusica),
            buscarMetadadosMusica(nome),
        ]);
        const musica = await criarMusica({
            nome,
            tomPadrao: tom || null,
            bpm: null,
            artista: metadados.artista,
            cifraUrl: metadados.linkCifraClub,
            audioUrl: linkMusica || metadados.linkSpotify,
            capaUrl: capaDoLink ?? metadados.capaUrl,
        });
        return musica.id;
    } catch {
        return null;
    }
}

export async function createRepertorioController(req: Request, res: Response) {
    try {
        const { cultoId, nome, tom, linkMusica} = req.body

        // Link da música é opcional: a Biblioteca já sugere cifra/áudio sozinha (ver
        // acharOuCriarMusicaDoRepertorio) — não faz sentido bloquear o cadastro por
        // causa de um link que a pessoa pode nem ter em mãos ainda.
        if (!cultoId || !nome || !tom) {
            return res.status(400).json({ message: 'Dados inválidos!' })
        }

        const linkMusicaTratado = typeof linkMusica === 'string' && linkMusica.trim() ? linkMusica.trim() : null;
        const musicaId = await acharOuCriarMusicaDoRepertorio(nome, tom, linkMusicaTratado);
        await createRepertorio(cultoId, nome, tom, linkMusicaTratado, musicaId);
        return res.status(201).json({ message: 'Repertório cadastrado com sucesso!' })
    } catch (error) {
        return res.status(500).json({ message: 'Erro localizado no servidor!'})
    }
}

export async function meuProximoCultoController(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado!'})
    }

    const [cultoVocal, cultoAvulsa] = await Promise.all([
        findProximoCultoDoMembro(req.user.id),
        findProximoCultoAvulsaDoMembro(req.user.id),
    ]);

    const candidatos = [cultoVocal, cultoAvulsa].filter(Boolean);

    if (candidatos.length === 0) {
        return res.status(404).json({ message: 'Culto não encontrada!'})
    }

    const culto = candidatos.reduce((maisProximo, atual) =>
        new Date(atual.data_hora) < new Date(maisProximo.data_hora) ? atual : maisProximo
    );

    const repertorios = await findAllRepertorios(culto.id)

    if (repertorios.length === 0) {
        return res.status(200).json({ message: 'Nenhum repertório cadastrado para este culto!', culto, repertorios: []})
    }

    return res.status(200).json({ message: 'Repertório encontrado com sucesso!', culto, repertorios})
}

export async function getRepertorioDoCultoController(req: Request, res: Response) {
    const { cultoId } = req.params;

    const repertorios = await findAllRepertorios(Number(cultoId));

    return res.status(200).json(repertorios);
}

export async function deleteRepertorioController(req: Request, res: Response) {
    const { id } = req.params;

    const repertorio = await findRepertorioById(Number(id));
    if (!repertorio) {
        return res.status(404).json({ message: 'Música não encontrada!' })
    }

    await deleteRepertorio(Number(id));
    return res.status(200).json({ message: 'Música removida com sucesso!' })
}