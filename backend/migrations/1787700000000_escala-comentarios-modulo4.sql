-- Módulo 4 (spec 11) · T-11.12: comentários por escala/culto.
--
-- Thread de comentários dentro de cada culto. Nasce multi-tenant: coluna `org_id`
-- + índice + RLS por org (mesmo padrão do Passo 4 / musicas-videos). Comentário some
-- junto com o culto (ON DELETE CASCADE) ou com o membro que escreveu.

-- Up Migration

CREATE TABLE escala_comentarios (
  id         SERIAL PRIMARY KEY,
  org_id     INTEGER NOT NULL REFERENCES organizacoes(id),
  culto_id   INTEGER NOT NULL REFERENCES cultos(id) ON DELETE CASCADE,
  membro_id  INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  texto      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escala_comentarios_org   ON escala_comentarios (org_id);
CREATE INDEX idx_escala_comentarios_culto ON escala_comentarios (culto_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON escala_comentarios TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE escala_comentarios_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE escala_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_comentarios FORCE ROW LEVEL SECURITY;
ALTER TABLE escala_comentarios
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON escala_comentarios
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON escala_comentarios;
DROP TABLE IF EXISTS escala_comentarios;
