-- Módulo 10 (spec 11) · T-11.28: Repertório+ — artista, cifra, áudio e pastas.
--
-- Estende o catálogo de `musicas` (spec 08) com `artista`, `cifra_url` (link) e
-- `audio_url` (link; o YouTube segue em `videos`). Adiciona coleções: `pastas` e
-- o vínculo N:N `pasta_musicas`. "Artistas" é agregação por `musicas.artista`
-- (sem tabela própria na v1). Nasce multi-tenant (RLS por org, padrão do Passo 4).

-- Up Migration

ALTER TABLE musicas ADD COLUMN artista   TEXT;
ALTER TABLE musicas ADD COLUMN cifra_url TEXT;
ALTER TABLE musicas ADD COLUMN audio_url TEXT;

CREATE TABLE pastas (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,  -- null = org toda
  nome          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pastas_org        ON pastas (org_id);
CREATE INDEX idx_pastas_ministerio ON pastas (ministerio_id);

CREATE TABLE pasta_musicas (
  pasta_id   INTEGER NOT NULL REFERENCES pastas(id) ON DELETE CASCADE,
  musica_id  INTEGER NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  org_id     INTEGER NOT NULL REFERENCES organizacoes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pasta_id, musica_id)
);

CREATE INDEX idx_pasta_musicas_musica ON pasta_musicas (musica_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON pastas TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE pastas_id_seq TO deepscales_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON pasta_musicas TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastas FORCE ROW LEVEL SECURITY;
ALTER TABLE pastas
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON pastas
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

ALTER TABLE pasta_musicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasta_musicas FORCE ROW LEVEL SECURITY;
ALTER TABLE pasta_musicas
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON pasta_musicas
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON pasta_musicas;
DROP TABLE IF EXISTS pasta_musicas;
DROP POLICY IF EXISTS org_isolation ON pastas;
DROP TABLE IF EXISTS pastas;
ALTER TABLE musicas DROP COLUMN IF EXISTS audio_url;
ALTER TABLE musicas DROP COLUMN IF EXISTS cifra_url;
ALTER TABLE musicas DROP COLUMN IF EXISTS artista;
