import { Request, Response } from 'express';
import { withBypass } from '../config/database';
import { findByEmail } from '../models/membroModel';
import { assinarTokenMembro } from '../utils/token';
import { cifrar, decifrar, temChaveCripto } from '../utils/cripto';
import { googleConfigurado, trocarCodigo, buscarPerfil, renovarAccessToken } from '../services/googleOAuth';
import { sincronizarAgenda } from '../services/googleCalendar';
import { upsertVinculo, buscarVinculo, listarVinculos, removerVinculo, DadosVinculo } from '../models/contaVinculadaModel';

/** GET /integracoes/status — o que está configurado no servidor (pra UI). */
export async function statusIntegracoesController(_req: Request, res: Response) {
    return res.status(200).json({ google: googleConfigurado() && temChaveCripto() });
}

/**
 * POST /membros/login-google — login social (só p/ quem JÁ é membro).
 * Recebe o `code` do fluxo popup; casa pelo e-mail e emite o nosso JWT.
 */
export async function loginGoogleController(req: Request, res: Response) {
    if (!googleConfigurado() || !temChaveCripto()) {
        return res.status(503).json({ message: 'Login com Google não está configurado no servidor.' });
    }
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const redirectUri = typeof req.body?.redirectUri === 'string' ? req.body.redirectUri : 'postmessage';
    if (!code) return res.status(400).json({ message: 'Código de autorização ausente.' });

    let perfil;
    let tokens;
    try {
        tokens = await trocarCodigo(code, redirectUri);
        perfil = await buscarPerfil(tokens.accessToken);
    } catch {
        return res.status(400).json({ message: 'Não foi possível validar com o Google.' });
    }
    if (!perfil.emailVerificado) {
        return res.status(400).json({ message: 'E-mail do Google não verificado.' });
    }

    const membro = await findByEmail(perfil.email);
    if (!membro) {
        return res.status(403).json({
            message: 'Não há conta com esse e-mail. Peça um convite ao seu ministério.',
        });
    }

    // Vincula (pré-sessão → bypass + org_id explícito). Guarda o refresh cifrado.
    const dados: DadosVinculo = { email: perfil.email, escopo: tokens.escopo };
    if (tokens.refreshToken) dados.refresh = cifrar(tokens.refreshToken);
    await withBypass((client) =>
        upsertVinculo(
            { membroId: membro.id, provedor: 'google', provedorUid: perfil.sub, dados, orgId: membro.org_id },
            client,
        ),
    );

    const token = assinarTokenMembro({
        id: membro.id,
        papel: membro.papel,
        papel_org: membro.papel_org,
        papel_ministerio: membro.papel_ministerio,
        org_id: membro.org_id,
    });
    return res.status(200).json({ token, message: 'Login com Google realizado!' });
}

/** POST /integracoes/google/conectar — vincula a conta Google do membro logado. */
export async function conectarGoogleController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    if (!googleConfigurado() || !temChaveCripto()) {
        return res.status(503).json({ message: 'Integração com Google não está configurada.' });
    }
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const redirectUri = typeof req.body?.redirectUri === 'string' ? req.body.redirectUri : 'postmessage';
    if (!code) return res.status(400).json({ message: 'Código de autorização ausente.' });

    let perfil;
    let tokens;
    try {
        tokens = await trocarCodigo(code, redirectUri);
        perfil = await buscarPerfil(tokens.accessToken);
    } catch {
        return res.status(400).json({ message: 'Não foi possível validar com o Google.' });
    }

    const dados: DadosVinculo = { email: perfil.email, escopo: tokens.escopo };
    if (tokens.refreshToken) dados.refresh = cifrar(tokens.refreshToken);
    await upsertVinculo({ membroId: req.user.id, provedor: 'google', provedorUid: perfil.sub, dados });
    return res.status(200).json({ message: 'Conta Google conectada!', email: perfil.email });
}

/** DELETE /integracoes/google — desvincula. */
export async function desconectarGoogleController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    await removerVinculo(req.user.id, 'google');
    return res.status(200).json({ message: 'Conta Google desconectada.' });
}

/** GET /integracoes — contas vinculadas do membro logado (sem tokens). */
export async function listarVinculosController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    return res.status(200).json(await listarVinculos(req.user.id));
}

/** POST /integracoes/google/agenda/sincronizar — empurra as escalas pro Google Agenda. */
export async function sincronizarAgendaController(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado!' });
    const vinculo = await buscarVinculo(req.user.id, 'google');
    const refreshCifrado = vinculo?.dados?.refresh as string | undefined;
    if (!refreshCifrado) {
        return res.status(400).json({
            message: 'Conecte sua conta Google (com permissão de Agenda) antes de sincronizar.',
        });
    }
    try {
        const { accessToken } = await renovarAccessToken(decifrar(refreshCifrado));
        const total = await sincronizarAgenda(accessToken, req.user.id);
        return res.status(200).json({ message: `Agenda sincronizada (${total} escala(s)).`, total });
    } catch {
        return res.status(502).json({ message: 'Falha ao sincronizar com o Google Agenda.' });
    }
}
