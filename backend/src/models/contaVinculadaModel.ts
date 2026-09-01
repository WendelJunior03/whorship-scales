import { query } from '../config/database';
import type { PoolClient } from 'pg';

// Contas vinculadas (módulo 11). `dados` guarda { email, escopo, refresh } — o
// refresh token vai CIFRADO (utils/cripto). org_id vem do DEFAULT/RLS, exceto no
// fluxo de LOGIN (pré-sessão), que passa um client em bypass e o org_id explícito.

export interface DadosVinculo {
  email?: string;
  escopo?: string;
  refresh?: string; // cifrado
}

export async function upsertVinculo(
  input: { membroId: number; provedor: string; provedorUid: string | null; dados: DadosVinculo; orgId?: number },
  client?: PoolClient,
) {
  const usaOrg = input.orgId !== undefined;
  const sql = `
    INSERT INTO contas_vinculadas (membro_id, provedor, provedor_uid, dados${usaOrg ? ', org_id' : ''})
    VALUES ($1, $2, $3, $4${usaOrg ? ', $5' : ''})
    ON CONFLICT (membro_id, provedor)
      DO UPDATE SET provedor_uid = EXCLUDED.provedor_uid,
                    dados = contas_vinculadas.dados || EXCLUDED.dados
    RETURNING *`;
  const params: unknown[] = [input.membroId, input.provedor, input.provedorUid, JSON.stringify(input.dados)];
  if (usaOrg) params.push(input.orgId);
  const result = client ? await client.query(sql, params) : await query(sql, params);
  return result.rows[0];
}

export async function buscarVinculo(membroId: number, provedor: string) {
  const result = await query(
    'SELECT * FROM contas_vinculadas WHERE membro_id = $1 AND provedor = $2',
    [membroId, provedor],
  );
  return result.rows[0];
}

/** Lista os vínculos do membro (sem expor os tokens — só provedor/email). */
export async function listarVinculos(membroId: number) {
  const result = await query(
    `SELECT provedor, provedor_uid, dados->>'email' AS email, created_at
       FROM contas_vinculadas WHERE membro_id = $1 ORDER BY provedor`,
    [membroId],
  );
  return result.rows;
}

export async function removerVinculo(membroId: number, provedor: string) {
  const result = await query(
    'DELETE FROM contas_vinculadas WHERE membro_id = $1 AND provedor = $2 RETURNING *',
    [membroId, provedor],
  );
  return result.rows[0];
}
