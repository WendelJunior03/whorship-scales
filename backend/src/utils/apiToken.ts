import { randomBytes, createHash } from 'node:crypto';

// Prefixo identificador do token (worship stage key). Ajuda a reconhecer o token
// em logs/vazamentos e a exibir um "prefixo" amigável na lista.
const PREFIXO = 'wsk_';

/** Hash determinístico (sha-256 hex) — guardamos SÓ isto; a auth compara por ele. */
export function hashApiToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Gera um token de API novo. Devolve o valor EM CLARO (mostrado uma única vez ao
 * criar), o hash pra persistir e um prefixo curto pra exibir depois na lista.
 */
export function gerarApiToken(): { token: string; hash: string; prefixo: string } {
    const token = PREFIXO + randomBytes(24).toString('base64url');
    return { token, hash: hashApiToken(token), prefixo: token.slice(0, 12) };
}
