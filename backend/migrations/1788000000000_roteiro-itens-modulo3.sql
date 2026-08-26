-- Módulo 3 (spec 11) · T-11.9: roteiro da escala (setlist cronometrado).
--
-- Cria `roteiro_itens`: a linha do tempo ordenada do culto (músicas + momentos),
-- cada item com duração e tom. Coexiste com `repertorio` (que segue sendo a lista de
-- "Músicas" com tom/YouTube) — o roteiro é o runsheet ordenado/cronometrado, semeado a
-- partir do repertório de cada culto. Nasce multi-tenant (RLS por org, padrão do Passo 4).
-- Além do schema da spec, guarda `link_musica` pra não perder o link que o repertório tem.

-- Up Migration

CREATE TABLE roteiro_itens (
  id          SERIAL PRIMARY KEY,
  org_id      INTEGER NOT NULL REFERENCES organizacoes(id),
  culto_id    INTEGER NOT NULL REFERENCES cultos(id) ON DELETE CASCADE,
  ordem       INTEGER NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('musica', 'momento')),
  musica_id   INTEGER REFERENCES musicas(id),   -- quando tipo='musica' e vem do catálogo
  titulo      TEXT,                             -- rótulo livre (momentos) ou override
  duracao_seg INTEGER,                          -- 223 = 3:43
  tom         TEXT,                             -- tom escolhido para ESTE culto
  link_musica TEXT,                             -- extensão: preserva o link do repertório
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roteiro_itens_org   ON roteiro_itens (org_id);
CREATE INDEX idx_roteiro_itens_culto ON roteiro_itens (culto_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON roteiro_itens TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE roteiro_itens_id_seq TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4.
ALTER TABLE roteiro_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE roteiro_itens FORCE ROW LEVEL SECURITY;
ALTER TABLE roteiro_itens
  ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting('app.current_org', true), '')::int;
CREATE POLICY org_isolation ON roteiro_itens
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Seed: cada música do repertório vira um item de roteiro (tipo='musica'), na ordem do id.
SET LOCAL app.bypass_rls = 'on';
INSERT INTO roteiro_itens (org_id, culto_id, ordem, tipo, titulo, tom, link_musica)
SELECT r.org_id, r.culto_id,
       row_number() OVER (PARTITION BY r.culto_id ORDER BY r.id),
       'musica', r.nome, r.tom, r.link_musica
FROM repertorio r;

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON roteiro_itens;
DROP TABLE IF EXISTS roteiro_itens;
