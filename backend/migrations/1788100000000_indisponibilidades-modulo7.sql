-- Módulo 7 (spec 11) · T-11.21: indisponibilidades do membro.
--
-- Membro marca datas/períodos em que NÃO pode servir; a sugestão de escala
-- (`sugerirVocais` / `findMembrosDisponiveisParaCulto`) passa a filtrar quem
-- está indisponível na data e no período do culto.
--
-- Além do schema mínimo da spec (data_inicio/data_fim/motivo), o mockup pede:
--   · periodo do dia (dia inteiro / matutino / vespertino / noturno)
--   · descricao (visível só p/ admin do ministério e p/ o próprio dono)
--   · recorrencia (v1 só 'nenhuma'; coluna já criada p/ evolução)
--   · ministerio_id opcional (contexto; null = vale p/ a org toda)
-- Nasce multi-tenant (RLS por org, padrão do Passo 4).

-- Up Migration

CREATE TABLE indisponibilidades (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  membro_id     INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE CASCADE,  -- null = global (org)
  descricao     TEXT,
  periodo       TEXT NOT NULL DEFAULT 'dia_inteiro'
                CHECK (periodo IN ('dia_inteiro', 'matutino', 'vespertino', 'noturno')),
  data_inicio   DATE NOT NULL,
  data_fim      DATE NOT NULL,   -- = data_inicio para 1 dia
  recorrencia   TEXT NOT NULL DEFAULT 'nenhuma'
                CHECK (recorrencia IN ('nenhuma', 'semanal', 'mensal')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT indisp_intervalo_valido CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_indisp_org        ON indisponibilidades (org_id);
CREATE INDEX idx_indisp_membro     ON indisponibilidades (membro_id);
CREATE INDEX idx_indisp_ministerio ON indisponibilidades (ministerio_id);
CREATE INDEX idx_indisp_datas      ON indisponibilidades (data_inicio, data_fim);

GRANT SELECT, INSERT, UPDATE, DELETE ON indisponibilidades TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE indisponibilidades_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE indisponibilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE indisponibilidades FORCE ROW LEVEL SECURITY;
ALTER TABLE indisponibilidades
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON indisponibilidades
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON indisponibilidades;
DROP TABLE IF EXISTS indisponibilidades;
