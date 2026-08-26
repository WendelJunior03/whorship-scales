-- Módulo 9 (spec 11) · T-11.26: avisos (comunicados da organização).
--
-- Mural de avisos da org — distinto de `notificacoes` (que são pessoais). Quem
-- publica é admin/líder (capacidade `aviso.publicar`); todo membro da org lê.
-- `aviso_leituras` registra quem já leu cada aviso (badge de não-lidos).
-- Ambas nascem multi-tenant (RLS por org, padrão do Passo 4).

-- Up Migration

CREATE TABLE avisos (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,  -- null = toda a org
  titulo        TEXT NOT NULL,
  corpo         TEXT,
  autor_id      INTEGER REFERENCES membros(id) ON DELETE SET NULL,
  publicado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avisos_org        ON avisos (org_id);
CREATE INDEX idx_avisos_ministerio ON avisos (ministerio_id);
CREATE INDEX idx_avisos_publicado  ON avisos (publicado_em DESC);

CREATE TABLE aviso_leituras (
  aviso_id   INTEGER NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  membro_id  INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  org_id     INTEGER NOT NULL REFERENCES organizacoes(id),
  lido_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (aviso_id, membro_id)
);

CREATE INDEX idx_aviso_leituras_membro ON aviso_leituras (membro_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON avisos TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE avisos_id_seq TO deepscales_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON aviso_leituras TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos FORCE ROW LEVEL SECURITY;
ALTER TABLE avisos
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON avisos
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

ALTER TABLE aviso_leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE aviso_leituras FORCE ROW LEVEL SECURITY;
ALTER TABLE aviso_leituras
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON aviso_leituras
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON aviso_leituras;
DROP TABLE IF EXISTS aviso_leituras;
DROP POLICY IF EXISTS org_isolation ON avisos;
DROP TABLE IF EXISTS avisos;
