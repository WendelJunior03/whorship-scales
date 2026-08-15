type Plano = 'pro' | 'free';

interface RecursoPlano {
   planoMinimo: Plano;
   flagAtiva: boolean;
}

const recursos: Record<string, RecursoPlano> = {
    // Exemplos/placeholder — decidir com Wendel o catálogo real (PRO x FREE).
    'exemplo.recurso': {
        planoMinimo: 'pro',
        flagAtiva: true
    },
    'exemplo.recurso_desativado': {
        planoMinimo: 'free',
        flagAtiva: false
    }
}

export function planoPermite(planoDaOrg: Plano, planoMinimo: Plano) :boolean {
    return true; // Ajustar depois
}

export function podeUsar(org: {plano: Plano}, recurso: string) :boolean {
    const regra = recursos[recurso]
    if (!regra) {
        throw new Error('Recurso não encontrado');
    }
    return regra.flagAtiva && planoPermite(org.plano, regra.planoMinimo);
}