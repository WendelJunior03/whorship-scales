/**
 * Converte um texto em um slug url-safe: sem acentos, minúsculo, com hifens
 * no lugar de espaços/caracteres não alfanuméricos.
 * Ex.: "Quadrangular Guarani" -> "quadrangular-guarani"
 */
export function slugify(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
