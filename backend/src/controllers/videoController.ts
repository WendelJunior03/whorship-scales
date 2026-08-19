import { Request, Response } from 'express';
import * as model from '../models/videoModel';
import { buscarMusica } from '../models/musicaModel';
import { extrairVideoIdYoutube } from '../utils/youtube';

const CATEGORIAS = ['oficial', 'playback', 'tutorial', 'ministracao'];

export async function criarVideoController(req: Request, res: Response) {
    if (!req.user) {
        throw new Error('req.user não configurado!');
    }
    const { musicaId, link, categoria, titulo } = req.body;

    if (!musicaId || !link || !categoria) {
        return res.status(400).json({ message: 'Informe a música, o link e a categoria.' });
    }
    if (!CATEGORIAS.includes(categoria)) {
        return res.status(400).json({ message: 'Categoria inválida.' });
    }

    const videoId = extrairVideoIdYoutube(String(link));
    if (!videoId) {
        return res.status(400).json({ message: 'Link do YouTube inválido.' });
    }

    // Garante que a música é da própria org (buscarMusica já sai escopada por RLS).
    const musica = await buscarMusica(Number(musicaId));
    if (!musica) {
        return res.status(404).json({ message: 'Música não encontrada!' });
    }

    const video = await model.criarVideo(
        Number(musicaId),
        'youtube',
        videoId,
        categoria,
        titulo ? String(titulo).trim() : null,
        req.user.id,
    );
    return res.status(201).json(video);
}

export async function listarVideosController(req: Request, res: Response) {
    const { musicaId } = req.query;
    if (musicaId) {
        return res.status(200).json(await model.listarVideosPorMusica(Number(musicaId)));
    }
    return res.status(200).json(await model.listarTodosVideos());
}

export async function apagarVideoController(req: Request, res: Response) {
    const video = await model.apagarVideo(Number(req.params.id));
    if (!video) {
        return res.status(404).json({ message: 'Vídeo não encontrado!' });
    }
    return res.status(200).json({ message: 'Vídeo removido com sucesso!' });
}
