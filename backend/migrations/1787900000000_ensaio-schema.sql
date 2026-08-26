-- Ensaio vinculado 1:1 a um culto (opcional, criação manual) — spec do dono do
-- projeto: "cada culto tem zero ou um ensaio, nunca mais de um; o culto continua
-- funcionando normalmente (repertório, equipe, escala de vocais) mesmo sem ensaio".
-- O 1:1 é garantido no próprio banco via UNIQUE(culto_id).
--
-- Participantes têm confirmação de presença própria (não reaproveita escala_vocal/
-- escala_avulsa) porque o ensaio não ocupa uma "vaga" de função — é só presença.

-- Up Migration

CREATE TABLE ensaios (
  id          SERIAL PRIMARY KEY,
  org_id      INTEGER NOT NULL REFERENCES organizacoes(id),
  culto_id    INTEGER NOT NULL UNIQUE REFERENCES cultos(id),
  data_hora   TIMESTAMPTZ NOT NULL,
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ensaio_participantes (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ensaio_id     INTEGER NOT NULL REFERENCES ensaios(id) ON DELETE CASCADE,
  membro_id     INTEGER NOT NULL REFERENCES membros(id),
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'recusado', 'falta')),
  confirmado_em TIMESTAMPTZ,
  UNIQUE (ensaio_id, membro_id)
);

CREATE INDEX idx_ensaios_org               ON ensaios (org_id);
CREATE INDEX idx_ensaios_culto             ON ensaios (culto_id);
CREATE INDEX idx_ensaio_participantes_org     ON ensaio_participantes (org_id);
CREATE INDEX idx_ensaio_participantes_ensaio  ON ensaio_participantes (ensaio_id);
CREATE INDEX idx_ensaio_participantes_membro  ON ensaio_participantes (membro_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ensaios, ensaio_participantes TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE ensaios_id_seq, ensaio_participantes_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do módulo de ministérios.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ensaios', 'ensaio_participantes']
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

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON ensaio_participantes;
DROP POLICY IF EXISTS org_isolation ON ensaios;

DROP TABLE IF EXISTS ensaio_participantes;
DROP TABLE IF EXISTS ensaios;
