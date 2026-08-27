/**
 * Passo 8 — testes de segurança por endpoint (Fase A, specs 01/02).
 *
 * Sobe o app real (supertest) contra o banco com RLS e cobre, endpoint a endpoint:
 *   • AUTORIZAÇÃO (Passo 5): membro comum recebe 403 em ações de admin/gestão.
 *   • ISOLAMENTO (Passo 4): org A não lê/edita/apaga nada da org B (404/vazio).
 *
 * Integração real: precisa do banco com as migrations aplicadas e do app conectando
 * como `deepscales_app` (não-superusuário). Pula (sem falhar) se o banco estiver
 * indisponível ou a conexão for superusuária (que ignora RLS).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../app';
import { pool, withBypass } from '../config/database';

let pular = false;
// Um servidor persistente (não um efêmero por request) — evita flakiness de
// handshake do supertest sob rajada de chamadas.
let server: Server;
const http = () => request(server);
const tag = `sec-test-${process.pid}`;

interface OrgSeed {
    orgId: number;
    adminId: number;
    adminEmail: string;
    vocalId: number;
    cultoId: number;
}

const A = {} as OrgSeed;
const B = {} as OrgSeed;
const tokens = { adminA: '', vocalA: '', adminB: '' };

async function semearOrg(nome: string, sufixo: string, senhaHash: string): Promise<OrgSeed> {
    return withBypass(async (client) => {
        const org = (await client.query(
            `INSERT INTO organizacoes (nome, codigo, slug, plano) VALUES ($1, $2, $3, 'free') RETURNING id`,
            [nome, `${sufixo}-${tag}`, `${sufixo}-${tag}`.toLowerCase()],
        )).rows[0];

        const admin = (await client.query(
            `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
             VALUES ($1, '000', ARRAY['Violão'], $2, 'admin', 'administrador', NULL, $3, $4) RETURNING id`,
            [`Admin ${nome}`, `admin-${sufixo}-${tag}@t.local`, senhaHash, org.id],
        )).rows[0];

        const vocal = (await client.query(
            `INSERT INTO membros (nome, telefone, instrumentos, email, papel, papel_org, papel_ministerio, senha, org_id)
             VALUES ($1, '000', ARRAY['Vocal'], $2, 'vocal', 'membro', 'vocal', $3, $4) RETURNING id`,
            [`Vocal ${nome}`, `vocal-${sufixo}-${tag}@t.local`, senhaHash, org.id],
        )).rows[0];

        const culto = (await client.query(
            `INSERT INTO cultos (data_hora, tipo, org_id) VALUES (NOW(), $1, $2) RETURNING id`,
            [`Culto ${nome}`, org.id],
        )).rows[0];

        await client.query(
            `INSERT INTO repertorio (culto_id, nome, tom, link_musica, org_id) VALUES ($1, 'Musica', 'G', 'http://x', $2)`,
            [culto.id, org.id],
        );

        await client.query(
            `INSERT INTO ensaios (culto_id, data_hora, org_id) VALUES ($1, NOW(), $2)`,
            [culto.id, org.id],
        );

        return {
            orgId: org.id,
            adminId: admin.id,
            adminEmail: `admin-${sufixo}-${tag}@t.local`,
            vocalId: vocal.id,
            cultoId: culto.id,
        };
    });
}

async function login(email: string): Promise<string> {
    const res = await http().post('/membros/login').send({ email, passwordUser: 'senha123' });
    return res.body.token;
}

const auth = (token: string) => `Bearer ${token}`;

beforeAll(async () => {
    try {
        const { rows } = await pool.query("SELECT current_setting('is_superuser') AS su");
        if (rows[0].su === 'on') {
            pular = true;
            return;
        }
    } catch {
        pular = true;
        return;
    }

    server = app.listen(0);
    const senhaHash = await bcrypt.hash('senha123', 10);
    Object.assign(A, await semearOrg('OrgA', 'AAA', senhaHash));
    Object.assign(B, await semearOrg('OrgB', 'BBB', senhaHash));

    tokens.adminA = await login(A.adminEmail);
    tokens.vocalA = await login(`vocal-AAA-${tag}@t.local`);
    tokens.adminB = await login(B.adminEmail);
});

afterAll(async () => {
    if (!pular && A.orgId && B.orgId) {
        const orgs = [A.orgId, B.orgId];
        await withBypass(async (client) => {
            await client.query('DELETE FROM pasta_musicas WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM pastas WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM videos WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM musicas WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM aviso_leituras WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM avisos WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM ministerio_membros WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM ministerios WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM indisponibilidades WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM ensaio_participantes WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM ensaios WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM repertorio WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM cultos WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM membros WHERE org_id = ANY($1)', [orgs]);
            await client.query('DELETE FROM organizacoes WHERE id = ANY($1)', [orgs]);
        });
    }
    if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await pool.end();
});

// Endpoints de admin/gestão: um membro comum (vocal) deve receber 403 em TODOS.
// Ids inexistentes de propósito (a autorização roda ANTES do controller, então
// não há efeito colateral nem risco de apagar dado semeado).
const ACOES_RESTRITAS: { m: 'post' | 'get' | 'delete' | 'put'; path: string }[] = [
    { m: 'post', path: '/cultos' },
    { m: 'delete', path: '/cultos/999999' },
    { m: 'post', path: '/membros/cadastro' },
    { m: 'get', path: '/membros' },
    { m: 'delete', path: '/membros/999999' },
    { m: 'post', path: '/escala-vocal' },
    { m: 'get', path: '/escala-vocal/sugestao' },
    { m: 'delete', path: '/escala-vocal/999999' },
    { m: 'post', path: '/escala-avulsa' },
    { m: 'delete', path: '/escala-avulsa/999999' },
    { m: 'post', path: '/repertorio' },
    { m: 'delete', path: '/repertorio/999999' },
    { m: 'post', path: '/ensaios' },
    { m: 'delete', path: '/ensaios/999999' },
    { m: 'post', path: '/avisos' },
    { m: 'delete', path: '/avisos/999999' },
    { m: 'put', path: '/avisos/999999' },
    { m: 'post', path: '/musicas' },
    { m: 'post', path: '/pastas' },
    { m: 'delete', path: '/pastas/999999' },
];

describe('Autorização por capacidade (Passo 5)', () => {
    it.each(ACOES_RESTRITAS)('vocal (membro) recebe 403 em $m $path', async (acao) => {
        if (pular) return;
        const res = await http()[acao.m](acao.path).set('Authorization', auth(tokens.vocalA)).send({});
        expect(res.status).toBe(403);
    });

    it('admin NÃO é bloqueado nas leituras de gestão (200)', async () => {
        if (pular) return;
        const membros = await http().get('/membros').set('Authorization', auth(tokens.adminA));
        expect(membros.status).toBe(200);
    });

    it('membro comum acessa o que é próprio (GET /membros/me e GET /cultos = 200)', async () => {
        if (pular) return;
        const me = await http().get('/membros/me').set('Authorization', auth(tokens.vocalA));
        const cultos = await http().get('/cultos').set('Authorization', auth(tokens.vocalA));
        expect(me.status).toBe(200);
        expect(cultos.status).toBe(200);
    });
});

describe('Isolamento entre organizações (Passo 4)', () => {
    it('GET /cultos só traz os cultos da própria org', async () => {
        if (pular) return;
        const res = await http().get('/cultos').set('Authorization', auth(tokens.adminA));
        const ids = res.body.map((c: { id: number }) => c.id);
        expect(ids).toContain(A.cultoId);
        expect(ids).not.toContain(B.cultoId);
    });

    it('A não lê um culto da B por id direto → 404', async () => {
        if (pular) return;
        const res = await http().get(`/cultos/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(res.status).toBe(404);
    });

    it('A não apaga um culto da B (404) e o culto da B continua existindo', async () => {
        if (pular) return;
        const del = await http().delete(`/cultos/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(del.status).toBe(404);
        const aindaExiste = await http().get(`/cultos/${B.cultoId}`).set('Authorization', auth(tokens.adminB));
        expect(aindaExiste.status).toBe(200);
    });

    it('GET /membros da A não inclui membros da B', async () => {
        if (pular) return;
        const res = await http().get('/membros').set('Authorization', auth(tokens.adminA));
        const ids = res.body.map((m: { id: number }) => m.id);
        expect(ids).toContain(A.adminId);
        expect(ids).not.toContain(B.adminId);
        expect(ids).not.toContain(B.vocalId);
    });

    it('A não lê um membro da B por id (corpo não traz o membro da B)', async () => {
        if (pular) return;
        const res = await http().get(`/membros/${B.adminId}`).set('Authorization', auth(tokens.adminA));
        expect(res.body?.id).toBeUndefined();
    });

    it('A não enxerga o repertório de um culto da B (lista vazia)', async () => {
        if (pular) return;
        const res = await http().get(`/repertorio/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(Array.isArray(res.body) ? res.body.length : 0).toBe(0);
    });

    it('A não enxerga o ensaio de um culto da B (mesmo ele existindo pra B)', async () => {
        if (pular) return;
        const daB = await http().get(`/ensaios/culto/${B.cultoId}`).set('Authorization', auth(tokens.adminB));
        expect(daB.body.ensaio).not.toBeNull();

        const daA = await http().get(`/ensaios/culto/${B.cultoId}`).set('Authorization', auth(tokens.adminA));
        expect(daA.body.ensaio).toBeNull();
    });
});

// Módulo 7 — indisponibilidades: escopo próprio, gestão e filtro na sugestão.
describe('Indisponibilidades (módulo 7)', () => {
    it('membro comum cria a PRÓPRIA indisponibilidade (201) e a vê no /me', async () => {
        if (pular) return;
        const criar = await http()
            .post('/indisponibilidades')
            .set('Authorization', auth(tokens.vocalA))
            .send({ periodo: 'dia_inteiro', dataInicio: '2099-01-10', dataFim: '2099-01-10', descricao: 'Viagem' });
        expect(criar.status).toBe(201);

        const minhas = await http().get('/indisponibilidades/me').set('Authorization', auth(tokens.vocalA));
        expect(minhas.status).toBe(200);
        expect(minhas.body.some((i: { id: number }) => i.id === criar.body.id)).toBe(true);
    });

    it('membro comum NÃO cria indisponibilidade de OUTRO membro (403)', async () => {
        if (pular) return;
        const res = await http()
            .post('/indisponibilidades')
            .set('Authorization', auth(tokens.vocalA))
            .send({ membroId: A.adminId, periodo: 'dia_inteiro', dataInicio: '2099-01-10', dataFim: '2099-01-10' });
        expect(res.status).toBe(403);
    });

    it('datas inválidas → 400 (fim antes do início)', async () => {
        if (pular) return;
        const res = await http()
            .post('/indisponibilidades')
            .set('Authorization', auth(tokens.vocalA))
            .send({ periodo: 'dia_inteiro', dataInicio: '2099-02-10', dataFim: '2099-02-01' });
        expect(res.status).toBe(400);
    });

    it('A (gestor) não enxerga indisponibilidade de um membro da B (isolamento por org)', async () => {
        if (pular) return;
        // Semeia uma indisponibilidade pro vocal da B, direto no banco (bypass).
        await withBypass(async (client) => {
            await client.query(
                `INSERT INTO indisponibilidades (membro_id, org_id, periodo, data_inicio, data_fim)
                 VALUES ($1, $2, 'dia_inteiro', '2099-03-01', '2099-03-01')`,
                [B.vocalId, B.orgId],
            );
        });
        const res = await http()
            .get(`/indisponibilidades/membro/${B.vocalId}`)
            .set('Authorization', auth(tokens.adminA));
        // RLS zera as linhas da outra org → lista vazia.
        expect(Array.isArray(res.body) ? res.body.length : -1).toBe(0);
    });

    it('aniversariantes do mês: filtra por mês e isola por org', async () => {
        if (pular) return;
        // Admin da A faz aniversário em maio; vocal da B em maio também (outra org).
        await withBypass(async (client) => {
            await client.query("UPDATE membros SET data_nascimento = '1990-05-15' WHERE id = $1", [A.adminId]);
            await client.query("UPDATE membros SET data_nascimento = '1992-05-20' WHERE id = $1", [B.vocalId]);
        });

        const maio = await http()
            .get('/membros/aniversariantes?mes=5')
            .set('Authorization', auth(tokens.adminA));
        expect(maio.status).toBe(200);
        const idsMaio = maio.body.map((m: { id: number }) => m.id);
        expect(idsMaio).toContain(A.adminId); // da própria org
        expect(idsMaio).not.toContain(B.vocalId); // isolado por org

        const junho = await http()
            .get('/membros/aniversariantes?mes=6')
            .set('Authorization', auth(tokens.adminA));
        expect(junho.body.map((m: { id: number }) => m.id)).not.toContain(A.adminId);
    });

    it('aniversariantes: mês inválido → 400', async () => {
        if (pular) return;
        const res = await http().get('/membros/aniversariantes?mes=13').set('Authorization', auth(tokens.adminA));
        expect(res.status).toBe(400);
    });

    it('aniversariantes: filtro por ministério só traz quem está nele', async () => {
        if (pular) return;
        // Admin da A já faz aniversário em maio (teste anterior). Cria um ministério
        // na A e coloca o admin nele.
        const min = await withBypass(async (client) => {
            await client.query("UPDATE membros SET data_nascimento = '1990-05-15' WHERE id = $1", [A.adminId]);
            const m = (await client.query(
                `INSERT INTO ministerios (org_id, nome) VALUES ($1, 'Louvor') RETURNING id`,
                [A.orgId],
            )).rows[0];
            await client.query(
                `INSERT INTO ministerio_membros (ministerio_id, membro_id, org_id) VALUES ($1, $2, $3)`,
                [m.id, A.adminId, A.orgId],
            );
            return m.id as number;
        });

        // Com o ministério do admin: aparece.
        const dentro = await http()
            .get(`/membros/aniversariantes?mes=5&ministerioId=${min}`)
            .set('Authorization', auth(tokens.adminA));
        expect(dentro.body.map((m: { id: number }) => m.id)).toContain(A.adminId);

        // Com um ministério inexistente: não aparece (lista vazia).
        const fora = await http()
            .get('/membros/aniversariantes?mes=5&ministerioId=99999999')
            .set('Authorization', auth(tokens.adminA));
        expect(fora.body.map((m: { id: number }) => m.id)).not.toContain(A.adminId);
    });

    it('sugestão de vocais EXCLUI quem marcou indisponibilidade na data do culto', async () => {
        if (pular) return;
        // Antes: o vocal da A aparece na sugestão do culto da A.
        const antes = await http()
            .get(`/escala-vocal/sugestao?cultoId=${A.cultoId}`)
            .set('Authorization', auth(tokens.adminA));
        expect(antes.body.vocais.some((v: { id: number }) => v.id === A.vocalId)).toBe(true);

        // Marca o vocal como indisponível no dia do culto (data_hora = NOW()).
        const hoje = new Date().toISOString().slice(0, 10);
        const criada = await http()
            .post('/indisponibilidades')
            .set('Authorization', auth(tokens.adminA))
            .send({ membroId: A.vocalId, periodo: 'dia_inteiro', dataInicio: hoje, dataFim: hoje });
        expect(criada.status).toBe(201);

        // Depois: some da sugestão.
        const depois = await http()
            .get(`/escala-vocal/sugestao?cultoId=${A.cultoId}`)
            .set('Authorization', auth(tokens.adminA));
        expect(depois.body.vocais.some((v: { id: number }) => v.id === A.vocalId)).toBe(false);
    });
});

// Módulo 9 — avisos: publicação restrita, leitura por todos, lido e isolamento.
describe('Avisos (módulo 9)', () => {
    it('admin publica; todo membro da org vê (com flag de lido) e marca como lido', async () => {
        if (pular) return;
        const criar = await http()
            .post('/avisos')
            .set('Authorization', auth(tokens.adminA))
            .send({ titulo: 'Reunião geral', corpo: 'Domingo após o culto.' });
        expect(criar.status).toBe(201);
        const avisoId = criar.body.id;

        // Vocal (membro comum) enxerga o aviso, ainda não lido.
        const lista = await http().get('/avisos').set('Authorization', auth(tokens.vocalA));
        const doVocal = lista.body.find((a: { id: number }) => a.id === avisoId);
        expect(doVocal).toBeTruthy();
        expect(doVocal.lido).toBe(false);

        // Aparece na contagem de não lidos e some depois de marcar lido.
        const antes = await http().get('/avisos/nao-lidos').set('Authorization', auth(tokens.vocalA));
        expect(antes.body.total).toBeGreaterThanOrEqual(1);

        const marca = await http()
            .post(`/avisos/${avisoId}/lido`)
            .set('Authorization', auth(tokens.vocalA));
        expect(marca.status).toBe(200);

        const relido = await http().get('/avisos').set('Authorization', auth(tokens.vocalA));
        expect(relido.body.find((a: { id: number }) => a.id === avisoId).lido).toBe(true);
    });

    it('aviso da org A não vaza pra org B (isolamento)', async () => {
        if (pular) return;
        const criar = await http()
            .post('/avisos')
            .set('Authorization', auth(tokens.adminA))
            .send({ titulo: 'Interno A' });
        const avisoId = criar.body.id;

        const listaB = await http().get('/avisos').set('Authorization', auth(tokens.adminB));
        expect(listaB.body.some((a: { id: number }) => a.id === avisoId)).toBe(false);

        const detalheB = await http().get(`/avisos/${avisoId}`).set('Authorization', auth(tokens.adminB));
        expect(detalheB.status).toBe(404);
    });

    it('publicar sem título → 400', async () => {
        if (pular) return;
        const res = await http().post('/avisos').set('Authorization', auth(tokens.adminA)).send({ corpo: 'x' });
        expect(res.status).toBe(400);
    });
});

// Módulo 10 — repertório+: campos novos da música, artistas e pastas.
describe('Repertório+ (módulo 10)', () => {
    it('música guarda artista/cifra/áudio e aparece na agregação de artistas', async () => {
        if (pular) return;
        const criar = await http()
            .post('/musicas')
            .set('Authorization', auth(tokens.adminA))
            .send({ nome: 'Grande é o Senhor', tomPadrao: 'G', bpm: 72, artista: 'Adhemar de Campos', cifraUrl: 'https://cifra/x', audioUrl: 'https://audio/x' });
        expect(criar.status).toBe(201);
        expect(criar.body.artista).toBe('Adhemar de Campos');
        expect(criar.body.cifra_url).toBe('https://cifra/x');

        const artistas = await http().get('/musicas/artistas').set('Authorization', auth(tokens.adminA));
        const encontrado = artistas.body.find((a: { artista: string }) => a.artista === 'Adhemar de Campos');
        expect(encontrado).toBeTruthy();
        expect(encontrado.total_musicas).toBeGreaterThanOrEqual(1);
    });

    it('pasta: criar, adicionar e remover música (gestor)', async () => {
        if (pular) return;
        const pasta = await http().post('/pastas').set('Authorization', auth(tokens.adminA)).send({ nome: 'Domingo' });
        expect(pasta.status).toBe(201);
        const musica = await http().post('/musicas').set('Authorization', auth(tokens.adminA)).send({ nome: 'Santo Espírito' });

        const add = await http()
            .post(`/pastas/${pasta.body.id}/musicas`)
            .set('Authorization', auth(tokens.adminA))
            .send({ musicaId: musica.body.id });
        expect(add.status).toBe(200);
        expect(add.body.some((m: { id: number }) => m.id === musica.body.id)).toBe(true);

        const rem = await http()
            .delete(`/pastas/${pasta.body.id}/musicas/${musica.body.id}`)
            .set('Authorization', auth(tokens.adminA));
        expect(rem.status).toBe(200);
        const depois = await http().get(`/pastas/${pasta.body.id}/musicas`).set('Authorization', auth(tokens.adminA));
        expect(depois.body.some((m: { id: number }) => m.id === musica.body.id)).toBe(false);
    });

    it('pasta da org A não vaza pra org B (isolamento)', async () => {
        if (pular) return;
        const pasta = await http().post('/pastas').set('Authorization', auth(tokens.adminA)).send({ nome: 'Interna A' });
        const listaB = await http().get('/pastas').set('Authorization', auth(tokens.adminB));
        expect(listaB.body.some((p: { id: number }) => p.id === pasta.body.id)).toBe(false);
    });

    it('membro comum lê o catálogo (GET /musicas e /pastas = 200)', async () => {
        if (pular) return;
        const musicas = await http().get('/musicas').set('Authorization', auth(tokens.vocalA));
        const pastas = await http().get('/pastas').set('Authorization', auth(tokens.vocalA));
        expect(musicas.status).toBe(200);
        expect(pastas.status).toBe(200);
    });
});
