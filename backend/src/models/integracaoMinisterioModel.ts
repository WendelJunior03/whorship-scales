import { query } from '../config/database';
import { cifrar, decifrar } from '../utils/cripto';

const TIPO_HOLYRICS = 'holyrics';

export interface HolyricsConfig {
    host: string;
    porta: number;
    /** Nunca devolvemos o token em claro — só se ele existe. */
    temToken: boolean;
    ativo: boolean;
}

/** Config do Holyrics do ministério, com o token MASCARADO. Tenant-scoped (RLS). */
export async function buscarHolyrics(ministerioId: number): Promise<HolyricsConfig | null> {
    const r = await query(
        'SELECT config, ativo FROM integracoes_ministerio WHERE ministerio_id = $1 AND tipo = $2',
        [ministerioId, TIPO_HOLYRICS],
    );
    const row = r.rows[0];
    if (!row) return null;
    const cfg = row.config ?? {};
    return {
        host: cfg.host ?? '',
        porta: Number(cfg.porta) || 0,
        temToken: !!cfg.token_cifrado,
        ativo: row.ativo,
    };
}

/**
 * Salva/atualiza a config do Holyrics. O token vai CIFRADO (AES-GCM). Se `token`
 * não vier, preserva o que já estava salvo (permite editar host/porta sem reenviar).
 */
export async function salvarHolyrics(
    ministerioId: number,
    input: { host: string; porta: number; token?: string | undefined; ativo: boolean },
): Promise<void> {
    const atual = await query(
        'SELECT config FROM integracoes_ministerio WHERE ministerio_id = $1 AND tipo = $2',
        [ministerioId, TIPO_HOLYRICS],
    );
    const tokenCifradoAtual: string | null = atual.rows[0]?.config?.token_cifrado ?? null;
    const tokenCifrado = input.token ? cifrar(input.token) : tokenCifradoAtual;

    const config = {
        host: input.host,
        porta: input.porta,
        ...(tokenCifrado ? { token_cifrado: tokenCifrado } : {}),
    };

    await query(
        `INSERT INTO integracoes_ministerio (ministerio_id, tipo, config, ativo)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT (ministerio_id, tipo)
         DO UPDATE SET config = EXCLUDED.config, ativo = EXCLUDED.ativo`,
        [ministerioId, TIPO_HOLYRICS, JSON.stringify(config), input.ativo],
    );
}

export async function removerHolyrics(ministerioId: number): Promise<boolean> {
    const r = await query(
        'DELETE FROM integracoes_ministerio WHERE ministerio_id = $1 AND tipo = $2 RETURNING id',
        [ministerioId, TIPO_HOLYRICS],
    );
    return (r.rowCount ?? 0) > 0;
}

/** Devolve host/porta/token EM CLARO (decifrado) — uso interno pro "testar conexão". */
export async function obterConexaoHolyrics(
    ministerioId: number,
): Promise<{ host: string; porta: number; token: string } | null> {
    const r = await query(
        'SELECT config FROM integracoes_ministerio WHERE ministerio_id = $1 AND tipo = $2',
        [ministerioId, TIPO_HOLYRICS],
    );
    const cfg = r.rows[0]?.config;
    if (!cfg?.token_cifrado) return null;
    return { host: cfg.host ?? '', porta: Number(cfg.porta) || 0, token: decifrar(cfg.token_cifrado) };
}
