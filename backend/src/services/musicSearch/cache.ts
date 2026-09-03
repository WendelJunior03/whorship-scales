/**
 * Cache em memória com TTL — não tem Redis (nem nada parecido) configurado no
 * projeto ainda, e o volume de buscas não justifica adicionar uma dependência só
 * pra isso. Reseta ao reiniciar o servidor; suficiente pro objetivo aqui (evitar
 * bater nas 4 APIs de novo pra cada pessoa que digita a mesma música).
 */
export class CacheComTtl<T> {
  private mapa = new Map<string, { valor: T; expiraEm: number }>();

  constructor(private ttlMs: number) {}

  get(chave: string): T | undefined {
    const entrada = this.mapa.get(chave);
    if (!entrada) return undefined;
    if (Date.now() > entrada.expiraEm) {
      this.mapa.delete(chave);
      return undefined;
    }
    return entrada.valor;
  }

  set(chave: string, valor: T): void {
    this.mapa.set(chave, { valor, expiraEm: Date.now() + this.ttlMs });
  }
}
