/**
 * Seed de desenvolvimento — popula o banco com dados de exemplo para testar.
 *
 * Uso: npm run seed   (após `npm run migrate:up`)
 *
 * Idempotente: se já houver membros, não faz nada (evita duplicar).
 * Login criado: admin@dev.local / senha123
 */
import bcrypt from 'bcrypt';
import { pool, query } from '../src/config/database';

async function seed() {
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM membros');
    if (rows[0].n > 0) {
        console.log('ℹ️  Banco já contém membros — seed ignorado (idempotente).');
        return;
    }

    const senha = await bcrypt.hash('senha123', 10);

    const admin = (await query(
        `INSERT INTO membros (nome, telefone, instrumento, email, papel, senha)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Admin Dev', '11999990000', 'Violão', 'admin@dev.local', 'admin', senha],
    )).rows[0];

    const vocal1 = (await query(
        `INSERT INTO membros (nome, telefone, instrumento, email, papel, senha)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Ana Vocal', '11999990001', 'Voz', 'ana@dev.local', 'vocal', senha],
    )).rows[0];

    const vocal2 = (await query(
        `INSERT INTO membros (nome, telefone, instrumento, email, papel, senha)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Bruno Vocal', '11999990002', 'Voz', 'bruno@dev.local', 'vocal', senha],
    )).rows[0];

    const culto = (await query(
        `INSERT INTO cultos (data_hora, tipo)
         VALUES (NOW() + INTERVAL '3 days', $1) RETURNING id`,
        ['Culto de Domingo'],
    )).rows[0];

    await query(
        `INSERT INTO escala_fixa (membro_id, dia_semana, funcao) VALUES ($1, $2, $3)`,
        [admin.id, 'domingo', 'Violão'],
    );

    await query(
        `INSERT INTO escala_vocal (membro_id, culto_id) VALUES ($1, $2)`,
        [vocal1.id, culto.id],
    );

    await query(
        `INSERT INTO escala_avulsa (membro_id, culto_id, funcao) VALUES ($1, $2, $3)`,
        [vocal2.id, culto.id, 'Backing vocal'],
    );

    await query(
        `INSERT INTO repertorio (culto_id, nome, tom, link_musica) VALUES ($1, $2, $3, $4)`,
        [culto.id, 'Grande é o Senhor', 'G', 'https://www.youtube.com/watch?v=exemplo'],
    );

    await query(
        `INSERT INTO notificacoes (membro_id, tipo, titulo, descricao)
         VALUES ($1, $2, $3, $4)`,
        [vocal1.id, 'escala', 'Você foi escalado', 'Escala de vocal para o Culto de Domingo'],
    );

    console.log('✅ Seed concluído.');
    console.log('   Login de teste:  admin@dev.local  /  senha123');
    console.log(`   Membros: 3 · Cultos: 1 · Escalas: fixa+vocal+avulsa · Repertório: 1`);
}

seed()
    .then(() => pool.end())
    .catch((err) => {
        console.error('❌ Erro no seed:', err);
        return pool.end().finally(() => process.exit(1));
    });
