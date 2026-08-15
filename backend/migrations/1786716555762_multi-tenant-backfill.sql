-- Multi-tenant · Passo 2 (parte 2/2): data migration (spec 01, T-01.3).
--
-- Cria a organização "seed" (que representa a igreja já existente), vincula
-- TODOS os registros atuais a ela e então torna `org_id` NOT NULL em todas as
-- tabelas. Em um banco vazio (dev novo) o backfill não afeta linhas — apenas a
-- org seed é criada e o NOT NULL passa a valer.
--
-- A org seed é identificável por slug = 'igreja-seed'.

-- Up Migration

-- 1) Cria a org seed (criado_por preenchido depois, quando soubermos um admin).
INSERT INTO organizacoes (nome, codigo, slug, plano)
VALUES ('Igreja (dados existentes)', 'SEED-K7M3PQ', 'igreja-seed', 'free');

-- 2) Vincula todos os registros existentes à org seed.
UPDATE membros       SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND membros.org_id       IS NULL;
UPDATE cultos        SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND cultos.org_id        IS NULL;
UPDATE escala_fixa   SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND escala_fixa.org_id   IS NULL;
UPDATE escala_vocal  SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND escala_vocal.org_id  IS NULL;
UPDATE escala_avulsa SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND escala_avulsa.org_id IS NULL;
UPDATE excecoes      SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND excecoes.org_id      IS NULL;
UPDATE repertorio    SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND repertorio.org_id    IS NULL;
UPDATE notificacoes  SET org_id = o.id FROM organizacoes o WHERE o.slug = 'igreja-seed' AND notificacoes.org_id  IS NULL;

-- 3) Define criado_por da org seed = primeiro admin ativo (se existir).
UPDATE organizacoes
SET criado_por = (SELECT id FROM membros WHERE papel = 'admin' AND ativo = true ORDER BY id LIMIT 1)
WHERE slug = 'igreja-seed';

-- 4) Agora que tudo está vinculado, org_id passa a ser obrigatório.
ALTER TABLE membros       ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE cultos        ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE escala_fixa   ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE escala_vocal  ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE escala_avulsa ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE excecoes      ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE repertorio    ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE notificacoes  ALTER COLUMN org_id SET NOT NULL;

-- Down Migration

-- Reverte na ordem inversa: solta o NOT NULL, desvincula os registros da org seed
-- e remove a org seed.
ALTER TABLE membros       ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE cultos        ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE escala_fixa   ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE escala_vocal  ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE escala_avulsa ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE excecoes      ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE repertorio    ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE notificacoes  ALTER COLUMN org_id DROP NOT NULL;

UPDATE membros       SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND membros.org_id       = o.id;
UPDATE cultos        SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND cultos.org_id        = o.id;
UPDATE escala_fixa   SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND escala_fixa.org_id   = o.id;
UPDATE escala_vocal  SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND escala_vocal.org_id  = o.id;
UPDATE escala_avulsa SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND escala_avulsa.org_id = o.id;
UPDATE excecoes      SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND excecoes.org_id      = o.id;
UPDATE repertorio    SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND repertorio.org_id    = o.id;
UPDATE notificacoes  SET org_id = NULL FROM organizacoes o WHERE o.slug = 'igreja-seed' AND notificacoes.org_id  = o.id;

DELETE FROM organizacoes WHERE slug = 'igreja-seed';
