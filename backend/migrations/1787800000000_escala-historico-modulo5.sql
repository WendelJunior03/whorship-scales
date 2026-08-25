-- Módulo 5 (spec 11) · T-11.15: histórico de alterações da escala (audit log).
--
-- Log por culto ("Fulano confirmou", "Fulano adicionou Beltrano"), com quem/quando/o quê.
-- Nasce multi-tenant: `org_id` + índice + RLS por org (mesmo padrão do Passo 4). Cada
-- registro tem `expira_em` (= data do culto + 7 dias); a limpeza é oportunista na camada
-- de aplicação (apaga `expira_em < now()` ao ler/gravar) — sem cron; um job agendado pode
-- substituir isso depois sem mudar o schema.

-- Up Migration

CREATE TABLE escala_historico (
  id         SERIAL PRIMARY KEY,
  org_id     INTEGER NOT NULL REFERENCES organizacoes(id),
  culto_id   INTEGER NOT NULL REFERENCES cultos(id) ON DELETE CASCADE,
  ator_id    INTEGER REFERENCES membros(id) ON DELETE SET NULL,  -- quem fez a ação (nullable)
  acao       TEXT NOT NULL,          -- 'adicionou_membro' | 'removeu_membro' | 'confirmou' | 'recusou' | 'falta'
  detalhe    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em  TIMESTAMPTZ            -- data do culto + 7 dias (limpeza oportunista)
);

CREATE INDEX idx_escala_historico_org    ON escala_historico (org_id);
CREATE INDEX idx_escala_historico_culto  ON escala_historico (culto_id);
CREATE INDEX idx_escala_historico_expira ON escala_historico (expira_em);

GRANT SELECT, INSERT, UPDATE, DELETE ON escala_historico TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE escala_historico_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE escala_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_historico FORCE ROW LEVEL SECURITY;
ALTER TABLE escala_historico
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON escala_historico
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON escala_historico;
DROP TABLE IF EXISTS escala_historico;
