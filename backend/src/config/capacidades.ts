type PapelOrg = 'administrador' | 'lider' | 'membro';
type PapelMinisterio = null | 'vocal' | 'instrumentista' | 'ministro' ;

interface RegraCapacidade {
    papelOrg: PapelOrg[];
    papelMinisterio: PapelMinisterio[];
}

const capacidades: Record<string, RegraCapacidade> = {
    'lideranca.convidar': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    },
    'lideranca.promover': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    },
    'lideranca.remover': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    },
    'reuniao.agendar': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    },
    'escala.gerenciar': {
        papelOrg: ['administrador'],
        papelMinisterio: ['ministro']
    },
    'membro.cadastrar': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    },
    'membro.listar': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    }, 
    'membro.desativar': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    },
    'culto.gerenciar': {
        papelOrg: ['administrador'],
        papelMinisterio: []
    }
}

export function podeAcessar(usuario: {papelOrg: PapelOrg, papelMinisterio: PapelMinisterio}, capacidade: string): boolean {
    const regra = capacidades[capacidade];
    if (!regra) {
        throw new Error('Capacidade não encontrada');
    }
    return regra.papelOrg.includes(usuario.papelOrg) || regra.papelMinisterio.includes(usuario.papelMinisterio); 
}