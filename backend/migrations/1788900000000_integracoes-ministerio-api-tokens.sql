-- Módulo 11 (spec 11) · T-11.33: integrações por ministério (Holyrics) + Tokens de API.
--
-- integracoes_ministerio: config de integração por ministério (v1: Holyrics). O
-- token do Holyrics vai CIFRADO dentro de `config` (utils/cripto.ts), nunca em claro.
-- api_tokens: tokens de acesso à API (read-only). Guarda só o HASH (sha-256) do token
-- — o valor em claro é mostrado uma única vez, na criação. Ambas nascem multi-tenant
-- (RLS por org, padrão do Passo 4).

-- Up Migration

CREATE TABLE integracoes_ministerio (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,                          -- 'holyrics' | ...
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,     -- ex.: { host, porta, token_cifrado }
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ministerio_id, tipo)                          -- 1 config por tipo por ministério
);

CREATE INDEX idx_integr_min_org ON integracoes_ministerio (org_id);

CREATE TABLE api_tokens (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,  -- NULL = escopo da org
  nome          TEXT NOT NULL,
  token_hash    TEXT NOT NULL,                          -- sha-256 do token (nunca o valor)
  prefixo       TEXT NOT NULL,                          -- primeiros chars, só p/ exibir na lista
  criado_por    INTEGER REFERENCES membros(id),
  ultimo_uso_em TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lookup por hash na autenticação da API (cross-tenant, via bypass) precisa ser único e rápido.
CREATE UNIQUE INDEX api_tokens_token_hash_key ON api_tokens (token_hash);
CREATE INDEX idx_api_tokens_org ON api_tokens (org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON integracoes_ministerio TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE integracoes_ministerio_id_seq TO deepscales_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_tokens TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE api_tokens_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE integracoes_ministerio ENABLE ROW LEVEL SECURITY;
ALTER TABLE integracoes_ministerio FORCE ROW LEVEL SECURITY;
ALTER TABLE integracoes_ministerio
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON integracoes_ministerio
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE api_tokens
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON api_tokens
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON api_tokens;
DROP POLICY IF EXISTS org_isolation ON integracoes_ministerio;
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS integracoes_ministerio;
