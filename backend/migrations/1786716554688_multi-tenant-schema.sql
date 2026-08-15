-- Multi-tenant · Passo 2 (parte 1/2): schema (spec 01, T-01.2).
--
-- Cria a tabela `organizacoes` e adiciona `org_id` (por enquanto NULLABLE) em
-- todas as 8 tabelas de dados. O backfill dos registros existentes e o NOT NULL
-- ficam na migration seguinte (parte 2/2, data migration), para que esta rode
-- sem quebrar um banco que já tem dados.

-- Up Migration

CREATE TABLE organizacoes (
    id         SERIAL PRIMARY KEY,
    nome       TEXT NOT NULL,
    codigo     TEXT NOT NULL UNIQUE,               -- código de convite: PREFIXO-XXXXXX (ex.: QG-83HF92)
    slug       TEXT NOT NULL UNIQUE,               -- identificador interno url-safe
    criado_por INTEGER REFERENCES membros(id),     -- admin criador (nullable: org "seed" não tem criador real)
    plano      TEXT NOT NULL DEFAULT 'free'
                   CHECK (plano IN ('free', 'pro')), -- ver spec 03 (plano PRO)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- org_id em todas as tabelas de dados (nullable nesta etapa; NOT NULL na próxima migration).
ALTER TABLE membros       ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE cultos        ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE escala_fixa   ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE escala_vocal  ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE escala_avulsa ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE excecoes      ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE repertorio    ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);
ALTER TABLE notificacoes  ADD COLUMN org_id INTEGER REFERENCES organizacoes(id);

-- Índice em org_id de cada tabela (todas as queries passam a filtrar por ele).
CREATE INDEX idx_membros_org       ON membros (org_id);
CREATE INDEX idx_cultos_org        ON cultos (org_id);
CREATE INDEX idx_escala_fixa_org   ON escala_fixa (org_id);
CREATE INDEX idx_escala_vocal_org  ON escala_vocal (org_id);
CREATE INDEX idx_escala_avulsa_org ON escala_avulsa (org_id);
CREATE INDEX idx_excecoes_org      ON excecoes (org_id);
CREATE INDEX idx_repertorio_org    ON repertorio (org_id);
CREATE INDEX idx_notificacoes_org  ON notificacoes (org_id);

-- Down Migration

-- Primeiro remove as colunas org_id (que referenciam organizacoes), depois a tabela.
ALTER TABLE membros       DROP COLUMN org_id;
ALTER TABLE cultos        DROP COLUMN org_id;
ALTER TABLE escala_fixa   DROP COLUMN org_id;
ALTER TABLE escala_vocal  DROP COLUMN org_id;
ALTER TABLE escala_avulsa DROP COLUMN org_id;
ALTER TABLE excecoes      DROP COLUMN org_id;
ALTER TABLE repertorio    DROP COLUMN org_id;
ALTER TABLE notificacoes  DROP COLUMN org_id;

DROP TABLE IF EXISTS organizacoes;
