-- Baseline do schema atual do Deep Scales (Fase A · Passo 1).
--
-- Reconstruído a partir das queries dos models em backend/src/models/*.
-- Objetivo: um banco criado só com esta migration é equivalente ao que já roda
-- hoje em produção, permitindo subir um ambiente de dev do zero.
--
-- ⚠️ Tipos/constraints marcados com "(inferido)" não estão versionados em lugar
-- nenhum — foram deduzidos do uso. Ao ter acesso ao `pg_dump --schema-only` do
-- banco real, vale reconciliar defaults e NOT NULL. Nada aqui muda o comportamento
-- da aplicação atual.

-- Up Migration

CREATE TABLE membros (
    id          SERIAL PRIMARY KEY,
    nome        TEXT NOT NULL,
    telefone    TEXT,
    instrumento TEXT,
    email       TEXT NOT NULL UNIQUE,
    papel       TEXT NOT NULL,                 -- admin | ministro | vocal | membro
    senha       TEXT NOT NULL,
    ativo       BOOLEAN NOT NULL DEFAULT TRUE  -- (inferido: findById/findAll filtram ativo = true)
);

CREATE TABLE cultos (
    id        SERIAL PRIMARY KEY,
    data_hora TIMESTAMPTZ NOT NULL,
    tipo      TEXT                             -- nullable (createCulto aceita null)
);

CREATE TABLE escala_fixa (
    id         SERIAL PRIMARY KEY,
    membro_id  INTEGER NOT NULL REFERENCES membros(id),
    dia_semana TEXT NOT NULL,                  -- domingo | quarta | sabado
    funcao     TEXT NOT NULL
);

CREATE TABLE escala_vocal (
    id        SERIAL PRIMARY KEY,
    membro_id INTEGER NOT NULL REFERENCES membros(id),
    culto_id  INTEGER NOT NULL REFERENCES cultos(id),
    status    TEXT NOT NULL DEFAULT 'pendente' -- (inferido: updateStatus define; SELECT retorna status)
);

CREATE TABLE escala_avulsa (
    id        SERIAL PRIMARY KEY,
    membro_id INTEGER NOT NULL REFERENCES membros(id),
    culto_id  INTEGER NOT NULL REFERENCES cultos(id),
    funcao    TEXT NOT NULL,
    status    TEXT NOT NULL DEFAULT 'pendente' -- (inferido)
);

CREATE TABLE excecoes (
    id             SERIAL PRIMARY KEY,
    escala_fixa_id INTEGER NOT NULL REFERENCES escala_fixa(id),
    data           DATE NOT NULL,
    substituto_id  INTEGER REFERENCES membros(id)  -- nullable (substituição opcional)
);

CREATE TABLE repertorio (
    id          SERIAL PRIMARY KEY,
    culto_id    INTEGER NOT NULL REFERENCES cultos(id),
    nome        TEXT NOT NULL,
    tom         TEXT,
    link_musica TEXT
);

CREATE TABLE notificacoes (
    id         SERIAL PRIMARY KEY,
    membro_id  INTEGER NOT NULL REFERENCES membros(id),
    tipo       TEXT NOT NULL,
    titulo     TEXT NOT NULL,
    descricao  TEXT,
    lida       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para as FKs mais consultadas (JOINs em escala/repertório/notificações).
CREATE INDEX idx_escala_fixa_membro   ON escala_fixa (membro_id);
CREATE INDEX idx_escala_vocal_culto   ON escala_vocal (culto_id);
CREATE INDEX idx_escala_vocal_membro  ON escala_vocal (membro_id);
CREATE INDEX idx_escala_avulsa_culto  ON escala_avulsa (culto_id);
CREATE INDEX idx_escala_avulsa_membro ON escala_avulsa (membro_id);
CREATE INDEX idx_excecoes_escala_fixa ON excecoes (escala_fixa_id);
CREATE INDEX idx_repertorio_culto     ON repertorio (culto_id);
CREATE INDEX idx_notificacoes_membro  ON notificacoes (membro_id);

-- Down Migration

DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS repertorio;
DROP TABLE IF EXISTS excecoes;
DROP TABLE IF EXISTS escala_avulsa;
DROP TABLE IF EXISTS escala_vocal;
DROP TABLE IF EXISTS escala_fixa;
DROP TABLE IF EXISTS cultos;
DROP TABLE IF EXISTS membros;
