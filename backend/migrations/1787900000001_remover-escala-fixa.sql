-- Remove a feature "Escala Fixa" (vaga semanal recorrente por dia da semana) e a
-- tabela `excecoes` (existia só pra registrar falta/substituição pontual numa vaga
-- de escala fixa) — decisão do dono do projeto: o time não usa mais esse modelo,
-- substituído por escala avulsa + ensaio pra cobrir os cultos.

-- Up Migration

DROP POLICY IF EXISTS org_isolation ON excecoes;
DROP POLICY IF EXISTS org_isolation ON escala_fixa;

DROP TABLE IF EXISTS excecoes;
DROP TABLE IF EXISTS escala_fixa;

-- Down Migration

CREATE TABLE escala_fixa (
    id            SERIAL PRIMARY KEY,
    membro_id     INTEGER NOT NULL REFERENCES membros(id),
    dia_semana    TEXT NOT NULL,
    funcao        TEXT NOT NULL,
    org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
    ministerio_id INTEGER REFERENCES ministerios(id),
    funcao_id     INTEGER REFERENCES funcoes(id)
);

CREATE TABLE excecoes (
    id             SERIAL PRIMARY KEY,
    escala_fixa_id INTEGER NOT NULL REFERENCES escala_fixa(id),
    data           DATE NOT NULL,
    substituto_id  INTEGER REFERENCES membros(id),
    org_id         INTEGER NOT NULL REFERENCES organizacoes(id)
);

CREATE INDEX idx_escala_fixa_membro     ON escala_fixa (membro_id);
CREATE INDEX idx_escala_fixa_org        ON escala_fixa (org_id);
CREATE INDEX idx_escala_fixa_ministerio ON escala_fixa (ministerio_id);
CREATE INDEX idx_escala_fixa_funcao     ON escala_fixa (funcao_id);
CREATE INDEX idx_excecoes_escala_fixa   ON excecoes (escala_fixa_id);
CREATE INDEX idx_excecoes_org           ON excecoes (org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON escala_fixa, excecoes TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE escala_fixa_id_seq, excecoes_id_seq TO deepscales_app;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['escala_fixa', 'excecoes']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting(''app.current_org'', true), '''')::int',
      t
    );
    EXECUTE format($f$
      CREATE POLICY org_isolation ON %I
        USING (
          current_setting('app.bypass_rls', true) = 'on'
          OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
        )
        WITH CHECK (
          current_setting('app.bypass_rls', true) = 'on'
          OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
        )
    $f$, t);
  END LOOP;
END
$$;
