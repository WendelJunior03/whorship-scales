/**
 * Autenticação Spotify via Client Credentials (app-only, sem login de usuário —
 * o Spotify não permite buscar catálogo sem token, mas esse fluxo não pede nada
 * do usuário final). Confirmado (fev/2026): esse fluxo continua funcionando pra
 * apps novos em "Development Mode", só que exige Premium ativo na conta do
 * desenvolvedor (dona das credenciais) e no máximo 10 resultados por busca —
 * ambos já respeitados aqui.
 */

interface TokenCache {
    token: string;
    expiraEm: number;
}

let cache: TokenCache | null = null;

export async function obterTokenSpotify(): Promise<string | null> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    if (cache && Date.now() < cache.expiraEm) return cache.token;

    try {
        const credenciais = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const resp = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credenciais}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });
        if (!resp.ok) {
            console.warn(`[Spotify] falha ao obter token (${resp.status}):`, await resp.text().catch(() => ''));
            return null;
        }
        const data = (await resp.json()) as { access_token?: string; expires_in?: number };
        if (!data.access_token) return null;
        // Margem de 60s antes do vencimento real, pra nunca usar um token borderline.
        cache = {
            token: data.access_token,
            expiraEm: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
        };
        return cache.token;
    } catch (e) {
        console.warn('[Spotify] erro ao obter token:', e);
        return null;
    }
}
