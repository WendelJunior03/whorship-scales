-- Módulo 11 (spec 11) · T-11.30/31: contas vinculadas (login social + integrações).
--
-- Guarda o vínculo de um membro com um provedor externo (Google, Apple, …).
-- `dados` (jsonb) guarda tokens/refs — o refresh token vai CIFRADO (ver
-- utils/cripto.ts), nunca em claro. UNIQUE(membro_id, provedor): 1 vínculo por
-- provedor por membro. Nasce multi-tenant (RLS por org, padrão do Passo 4).

-- Up Migration

CREATE TABLE contas_vinculadas (
  id           SERIAL PRIMARY KEY,
  org_id       INTEGER NOT NULL REFERENCES organizacoes(id),
  membro_id    INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  provedor     TEXT NOT NULL,          -- 'google' | 'apple' | ...
  provedor_uid TEXT,                   -- id externo (sub do Google, etc.)
  dados        JSONB NOT NULL DEFAULT '{}'::jsonb,  -- tokens (refresh cifrado), escopos, email
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membro_id, provedor)
);

CREATE INDEX idx_contas_vinculadas_org    ON contas_vinculadas (org_id);
CREATE INDEX idx_contas_vinculadas_membro ON contas_vinculadas (membro_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON contas_vinculadas TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE contas_vinculadas_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE contas_vinculadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_vinculadas FORCE ROW LEVEL SECURITY;
ALTER TABLE contas_vinculadas
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON contas_vinculadas
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON contas_vinculadas;
DROP TABLE IF EXISTS contas_vinculadas;
