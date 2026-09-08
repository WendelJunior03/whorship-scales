/**
 * Cifra Club não tem API pública (verificado antes de implementar — só o site
 * mesmo). Como não dá pra saber a URL exata da cifra sem isso, não inventamos
 * uma URL específica: geramos um link de PESQUISA no site deles, que sempre
 * existe e sempre funciona (confirmado testando `cifraclub.com.br/search/?q=`
 * antes de usar) — a pessoa clica e escolhe a versão certa lá.
 */
export function resolverLinkCifraClub(title: string, artist: string): string | null {
    const termo = [title, artist].filter(Boolean).join(' ').trim();
    if (!termo) return null;
    return `https://www.cifraclub.com.br/search/?q=${encodeURIComponent(termo)}`;
}
