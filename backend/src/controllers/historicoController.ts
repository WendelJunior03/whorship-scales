import { Request, Response } from 'express';
import { listarHistoricoDoCulto } from '../models/historicoModel';

export async function listarHistoricoController(req: Request, res: Response) {
    const cultoId = Number(req.params.cultoId);
    if (!Number.isInteger(cultoId) || cultoId <= 0) {
        return res.status(400).json({ message: 'cultoId inválido!' });
    }
    const historico = await listarHistoricoDoCulto(cultoId);
    return res.status(200).json(historico);
}
