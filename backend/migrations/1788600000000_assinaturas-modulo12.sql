-- Módulo 12 (spec 11) · T-11.34: assinaturas (pacotes de vagas extras).
--
-- Modelo híbrido (D-11.2): cada ministério tem `vagas_gratis` (10) e o dono compra
-- PACOTES de vagas extras (assinaturas) e distribui entre os ministérios via
-- `ministerios.vagas_extras`. O "pool" comprado = soma de `vagas_total` das
-- assinaturas ativas; o alocado = soma de `vagas_extras` dos ministérios.
-- O billing real (loja/Stripe) fica pra depois — `provider_ref` guarda o id externo.
-- Nasce multi-tenant (RLS por org, padrão do Passo 4).

-- Up Migration

CREATE TABLE assinaturas (
  id             SERIAL PRIMARY KEY,
  org_id         INTEGER NOT NULL REFERENCES organizacoes(id),
  responsavel_id INTEGER REFERENCES membros(id) ON DELETE SET NULL,
  plano          TEXT,                              -- '+10', '+20'...
  vagas_total    INTEGER NOT NULL CHECK (vagas_total >= 0),
  ciclo          TEXT NOT NULL DEFAULT 'mensal' CHECK (ciclo IN ('mensal', 'anual')),
  status         TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'pendente')),
  provider_ref   TEXT,                              -- id na loja/gateway (futuro)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assinaturas_org ON assinaturas (org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON assinaturas TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE assinaturas_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas FORCE ROW LEVEL SECURITY;
ALTER TABLE assinaturas
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON assinaturas
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON assinaturas;
DROP TABLE IF EXISTS assinaturas;
