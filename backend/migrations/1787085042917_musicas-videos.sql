-- Biblioteca de vídeos · spec 08. Cria o catálogo `musicas` (por org) e `videos`
-- ligados a ele. Tabelas novas nascem multi-tenant: RLS igual ao Passo 4 (isolamento
-- por org garantido no banco). O refactor do `repertorio` p/ referenciar `musicas` fica
-- para depois (aditivo agora). Coluna `bpm` já entra (prepara o metrônomo, spec 10).

-- Up Migration

CREATE TABLE musicas (
  id          SERIAL PRIMARY KEY,
  org_id      INTEGER NOT NULL REFERENCES organizacoes(id),
  nome        TEXT NOT NULL,
  tom_padrao  TEXT,
  bpm         INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE videos (
  id             SERIAL PRIMARY KEY,
  org_id         INTEGER NOT NULL REFERENCES organizacoes(id),
  musica_id      INTEGER NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL DEFAULT 'youtube',
  video_id       TEXT NOT NULL,
  categoria      TEXT NOT NULL CHECK (categoria IN ('oficial', 'playback', 'tutorial', 'ministracao')),
  titulo         TEXT,
  adicionado_por INTEGER REFERENCES membros(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_musicas_org ON musicas (org_id);
CREATE INDEX idx_videos_org ON videos (org_id);
CREATE INDEX idx_videos_musica ON videos (org_id, musica_id);

-- Acesso do role da aplicação (belt-and-suspenders; as default privileges do Passo 4 já cobrem).
GRANT SELECT, INSERT, UPDATE, DELETE ON musicas, videos TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE musicas_id_seq, videos_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['musicas', 'videos']
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

DROP POLICY IF EXISTS org_isolation ON videos;
DROP POLICY IF EXISTS org_isolation ON musicas;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS musicas;
