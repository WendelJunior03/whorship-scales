export type PapelOrg = 'administrador' | 'lider' | 'membro';
export type PapelMinisterio = 'vocal' | 'instrumentista' | 'ministro';
type Escopo = 'organizacao' | 'ministerio' | 'proprio'

interface RegraCapacidade {
    papelOrg: PapelOrg[];
    papelMinisterio: PapelMinisterio[];
    escopo: Escopo[];
}

const capacidades: Record<string, RegraCapacidade> = {
    //Funcionalidades que já existem no nosso sistema
    'membro.cadastrar': {
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'membro.listar': {
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    }, 
    'membro.visualizar': {
        papelOrg: ['administrador'],
        papelMinisterio: ['ministro'],
        escopo: ['organizacao', 'proprio']
    },
    'membro.editar': {
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao', 'proprio']
    },
    'membro.papel.alterar': {
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'membro.senha.alterar': {
        papelOrg: [],
        papelMinisterio: [],
        escopo: ['proprio']
    },
    'membro.desativar': {
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },

    'culto.gerenciar': {
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'culto.visualizar'	:{
        papelOrg: ['administrador', 'lider', 'membro'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'escala.gerenciar': {
        papelOrg: ['administrador'],
        papelMinisterio: ['ministro'],
        escopo: ['organizacao']
    },
    'escala.visualizar':{
        papelOrg: ['administrador', 'lider', 'membro'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'escala.ver_propria':{
        papelOrg: [],
        papelMinisterio: [],
        escopo: ['proprio']
    },
    'escalacao.confirmar':{
        papelOrg: [],
        papelMinisterio: [],
        escopo: ['proprio']
    },
    'excecao.criar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao', 'proprio']
    },
    'repertorio.gerenciar':{
        papelOrg: ['administrador'],
        papelMinisterio: ['ministro'],
        escopo: ['organizacao']
    },
    'repertorio.visualizar':{
        papelOrg: ['administrador', 'lider', 'membro'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'notificacao.ver_propria':{
        papelOrg: [],
        papelMinisterio: [],
        escopo: ['proprio']
    },
    'notificacao.marcar_lida':{
        papelOrg: [],
        papelMinisterio: [],
        escopo: ['proprio']
    },
    //Novas funcionalidades (Multi-tenant (spec 01))
    'organizacao.editar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'organizacao.transferir':{
        papelOrg: [], // Ainda em decisão
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'codigo_convite.ver':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'codigo_convite.criar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    //Novas funcionalidades (Liderança e reuniões (spec 07 — Fase D))
    'lideranca.convidar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'lideranca.promover':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'lideranca.remover':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'reuniao.agendar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'reuniao.participar':{
        papelOrg: ['administrador', 'lider'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'reuniao.material.visualizar':{
        papelOrg: ['administrador', 'lider'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'reuniao.material.gerenciar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    //Novas funcionalidades (Biblioteca de músicas (specs 08 e 10))
    'musica.gerenciar':{
        papelOrg: ['administrador'],
        papelMinisterio: ['ministro'],
        escopo: ['organizacao']
    },
    'musica.visualizar':{
        papelOrg: ['administrador', 'lider', 'membro'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'video.gerenciar':{
        papelOrg: ['administrador'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
    'video.visualizar':{
        papelOrg: ['administrador', 'lider', 'membro'],
        papelMinisterio: [],
        escopo: ['organizacao']
    },
}

export function podeAcessar(usuario: {papelOrg: PapelOrg, papelMinisterio: PapelMinisterio | null}, capacidade: string): boolean {
    const regra = capacidades[capacidade];
    if (!regra) {
        throw new Error('Capacidade não encontrada');
    }
    const liberaPorMinisterio = usuario.papelMinisterio !== null && regra.papelMinisterio.includes(usuario.papelMinisterio);
    return regra.papelOrg.includes(usuario.papelOrg) || liberaPorMinisterio;
}

export function mesmoUsuario(idDoRecurso: number, usuarioId: number): boolean {
    return idDoRecurso === usuarioId;
}
