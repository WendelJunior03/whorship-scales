-- Módulo 1 (spec 11) · T-11.3 (parte 4/4): backfill de ministerio_id/funcao_id.
--
-- Liga os registros de escala/culto/repertório já existentes ao ministério inicial da
-- sua organização (o de menor id — o "seed" criado no backfill 1787200000001) e converte
-- a coluna livre `funcao` (texto) em `funcao_id`. Para não perder nenhum valor de função
-- legado que não exista em `funcoes`, cria as funções faltantes no ministério antes de
-- ligar. Em banco vazio (dev novo) não afeta linhas.
--
-- A coluna `funcao` (texto) é mantida (legado) — remoção seria destrutiva.

-- Up Migration

-- Backfill é cross-org por natureza; bypass explícito (mesma razão do 1787200000001).
SET LOCAL app.bypass_rls = 'on';

-- Ministério-alvo por org = o de menor id (seed). Reutilizado nos passos abaixo.
-- 1) ministerio_id nas tabelas que só precisam do vínculo com o ministério.
UPDATE cultos c
   SET ministerio_id = m.id
  FROM (SELECT org_id, MIN(id) AS id FROM ministerios GROUP BY org_id) m
 WHERE c.org_id = m.org_id AND c.ministerio_id IS NULL;

UPDATE escala_vocal e
   SET ministerio_id = m.id
  FROM (SELECT org_id, MIN(id) AS id FROM ministerios GROUP BY org_id) m
 WHERE e.org_id = m.org_id AND e.ministerio_id IS NULL;

UPDATE repertorio r
   SET ministerio_id = m.id
  FROM (SELECT org_id, MIN(id) AS id FROM ministerios GROUP BY org_id) m
 WHERE r.org_id = m.org_id AND r.ministerio_id IS NULL;

UPDATE escala_fixa e
   SET ministerio_id = m.id
  FROM (SELECT org_id, MIN(id) AS id FROM ministerios GROUP BY org_id) m
 WHERE e.org_id = m.org_id AND e.ministerio_id IS NULL;

UPDATE escala_avulsa e
   SET ministerio_id = m.id
  FROM (SELECT org_id, MIN(id) AS id FROM ministerios GROUP BY org_id) m
 WHERE e.org_id = m.org_id AND e.ministerio_id IS NULL;

-- 2) Cria em `funcoes` qualquer valor de `funcao` (texto) legado que ainda não exista no
--    ministério-alvo (evita perda de dados na conversão texto -> FK). funcoes não tem
--    unique (ministerio_id, nome), então usa WHERE NOT EXISTS (igual ao backfill 2/2).
INSERT INTO funcoes (org_id, ministerio_id, nome)
SELECT DISTINCT src.org_id, src.ministerio_id, src.funcao
FROM (
  SELECT org_id, ministerio_id, funcao FROM escala_fixa   WHERE funcao IS NOT NULL AND ministerio_id IS NOT NULL
  UNION
  SELECT org_id, ministerio_id, funcao FROM escala_avulsa WHERE funcao IS NOT NULL AND ministerio_id IS NOT NULL
) src
WHERE NOT EXISTS (
  SELECT 1 FROM funcoes f
   WHERE f.ministerio_id = src.ministerio_id AND f.nome = src.funcao
);

-- 3) funcao_id = a função (do mesmo ministério) cujo nome bate com o texto legado.
UPDATE escala_fixa e
   SET funcao_id = f.id
  FROM funcoes f
 WHERE f.ministerio_id = e.ministerio_id AND f.nome = e.funcao
   AND e.funcao_id IS NULL;

UPDATE escala_avulsa e
   SET funcao_id = f.id
  FROM funcoes f
 WHERE f.ministerio_id = e.ministerio_id AND f.nome = e.funcao
   AND e.funcao_id IS NULL;

-- Down Migration

-- Reverte só o vínculo (as funções criadas no passo 2 não são distinguíveis das demais;
-- desligar funcao_id/ministerio_id é suficiente e não destrói dados de `funcao`).
SET LOCAL app.bypass_rls = 'on';
UPDATE escala_avulsa SET funcao_id = NULL, ministerio_id = NULL;
UPDATE escala_fixa   SET funcao_id = NULL, ministerio_id = NULL;
UPDATE repertorio    SET ministerio_id = NULL;
UPDATE escala_vocal  SET ministerio_id = NULL;
UPDATE cultos        SET ministerio_id = NULL;
