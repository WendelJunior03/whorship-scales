-- Módulo 1 (spec 11) · parte 2/2: data migration (ministério "seed").
--
-- Para cada organização já existente, cria UM ministério inicial (com o nome da org),
-- vincula todos os membros ativos a ele (papel do ministério derivado do papel_org) e
-- semeia as funções-base, derivando as funções de cada membro a partir de
-- `papel_ministerio`. Em banco vazio (dev novo) não afeta linhas.
--
-- `papel_ministerio` NÃO é removido — a derivação é aditiva (spec 11: pode ser
-- substituído por membro_funcoes no futuro, decidido na implementação).

-- Up Migration

-- Se o role da migration não for superusuário, o FORCE RLS das novas tabelas valeria;
-- bypass explícito garante que o backfill (cross-org por natureza) insira em qualquer org.
SET LOCAL app.bypass_rls = 'on';

-- 1) Um ministério inicial por organização (identificável pela descrição-marcador).
INSERT INTO ministerios (org_id, nome, descricao)
SELECT o.id, o.nome, 'Ministério inicial (migrado dos dados existentes).'
FROM organizacoes o
WHERE NOT EXISTS (SELECT 1 FROM ministerios m WHERE m.org_id = o.id);

-- 2) Vincula todos os membros ativos ao ministério inicial da sua org.
--    Administrador da org entra como administrador do ministério; demais como membro.
INSERT INTO ministerio_membros (ministerio_id, membro_id, org_id, papel)
SELECT m.id, mb.id, mb.org_id,
       CASE WHEN mb.papel_org = 'administrador' THEN 'administrador' ELSE 'membro' END
FROM membros mb
JOIN ministerios m ON m.org_id = mb.org_id
WHERE mb.ativo = true
ON CONFLICT (ministerio_id, membro_id) DO NOTHING;

-- 3) Funções-base em cada ministério inicial (espelham os valores de papel_ministerio).
INSERT INTO funcoes (org_id, ministerio_id, nome)
SELECT m.org_id, m.id, f.nome
FROM ministerios m
CROSS JOIN (VALUES ('Ministro'), ('Vocalista'), ('Instrumentista')) AS f(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM funcoes fx WHERE fx.ministerio_id = m.id AND fx.nome = f.nome
);

-- 4) Deriva as funções de cada membro a partir de papel_ministerio.
INSERT INTO membro_funcoes (membro_id, funcao_id, ministerio_id, org_id)
SELECT mb.id, f.id, m.id, mb.org_id
FROM membros mb
JOIN ministerios m ON m.org_id = mb.org_id
JOIN funcoes f ON f.ministerio_id = m.id AND f.nome = CASE mb.papel_ministerio
    WHEN 'ministro'       THEN 'Ministro'
    WHEN 'vocal'          THEN 'Vocalista'
    WHEN 'instrumentista' THEN 'Instrumentista'
  END
WHERE mb.ativo = true AND mb.papel_ministerio IS NOT NULL
ON CONFLICT (membro_id, funcao_id) DO NOTHING;

-- Down Migration

-- Remove só o que este backfill criou: os ministérios iniciais (marcados) e, por
-- CASCADE, seus vínculos/funções/derivações.
SET LOCAL app.bypass_rls = 'on';
DELETE FROM ministerios WHERE descricao = 'Ministério inicial (migrado dos dados existentes).';
