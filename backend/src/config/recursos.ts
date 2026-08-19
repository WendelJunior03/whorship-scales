/**
 * Catálogo central de recursos + resolvedor por plano (spec 03, feature flags caseiro).
 *
 * Três eixos de acesso (D-03.2): `flag_ativa && plano_permite && rbac_permite`.
 * Este arquivo cobre os dois primeiros; o RBAC (quem pode) vive em capacidades.ts.
 *
 * ⚠️ v1: NADA é bloqueado por plano ainda (LIBERAR_TUDO_V1 = true → planoPermite sempre
 * true). O ponto de checagem já existe: quando a cobrança entrar, é só "virar a chave".
 * O eixo de FLAG (flagAtiva) já funciona de verdade — serve pra esconder features ainda
 * não lançadas, independente de plano.
 */

export type Plano = 'free' | 'pro';

interface RecursoPlano {
    /** Plano mínimo para usar o recurso quando o gating por plano estiver ligado. */
    planoMinimo: Plano;
    /** Liga/desliga global do recurso (independente de plano). false = ainda não lançado. */
    flagAtiva: boolean;
}

/**
 * Chave de virada da v1. Enquanto `true`, o gating POR PLANO fica dormente (tudo liberado).
 * Vire para `false` quando a cobrança PRO entrar → o plano_minimo passa a valer.
 * (O eixo de flag continua valendo nos dois modos.)
 */
export const LIBERAR_TUDO_V1 = true;

const ordemPlanos: Record<Plano, number> = { free: 0, pro: 1 };

/**
 * Catálogo. Candidatos a PRO vieram da spec original (03). Quase tudo já com a flag ligada
 * (liberado na v1); o que ainda não existe no produto fica com `flagAtiva: false`.
 */
export const recursos: Record<string, RecursoPlano> = {
    'offline.download':            { planoMinimo: 'pro', flagAtiva: true },
    'pads.pack_premium':          { planoMinimo: 'pro', flagAtiva: true },
    'biblioteca.premium':         { planoMinimo: 'pro', flagAtiva: true },
    'samples.upload':             { planoMinimo: 'pro', flagAtiva: true },
    'afinador.avancado':          { planoMinimo: 'pro', flagAtiva: true },
    'organizacoes.ilimitadas':    { planoMinimo: 'pro', flagAtiva: true },
    'armazenamento.expandido':    { planoMinimo: 'pro', flagAtiva: true },
    'playlists':                  { planoMinimo: 'pro', flagAtiva: true },
    'estatisticas':               { planoMinimo: 'pro', flagAtiva: true },
    'lideranca.recursos_avancados': { planoMinimo: 'pro', flagAtiva: true },
    'conteudos.exclusivos':       { planoMinimo: 'pro', flagAtiva: true },
    // Biblioteca de vídeos (spec 08): cadastro/consulta é free; estes são PRO/futuro.
    'videos.playlist':            { planoMinimo: 'pro', flagAtiva: true },
    'videos.upload':              { planoMinimo: 'pro', flagAtiva: true },
    'videos.privado':             { planoMinimo: 'pro', flagAtiva: true },
    // Ainda não lançado no produto → flag desligada (exemplo real do eixo de flag).
    'backup.automatico':          { planoMinimo: 'pro', flagAtiva: false },
};

/**
 * Comparação pura de hierarquia de planos (free < pro). É a regra que passa a valer quando
 * `LIBERAR_TUDO_V1` for desligado — exposta para teste do gating "pronto pra virar a chave".
 */
export function planoAtendeMinimo(planoDaOrg: Plano, planoMinimo: Plano): boolean {
    return ordemPlanos[planoDaOrg] >= ordemPlanos[planoMinimo];
}

/** Resolve se o plano da org permite o recurso. Na v1, sempre true (spec 03, D-03.2). */
export function planoPermite(planoDaOrg: Plano, planoMinimo: Plano): boolean {
    if (LIBERAR_TUDO_V1) {
        return true;
    }
    return planoAtendeMinimo(planoDaOrg, planoMinimo);
}

/** Fonte da verdade (D-03.3): a org pode usar o recurso? (flag ligada E plano permite). */
export function podeUsar(org: { plano: Plano }, recurso: string): boolean {
    const regra = recursos[recurso];
    if (!regra) {
        throw new Error('Recurso não encontrado');
    }
    return regra.flagAtiva && planoPermite(org.plano, regra.planoMinimo);
}
