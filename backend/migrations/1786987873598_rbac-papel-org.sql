-- RBAC · Passo 5 (spec 02): dois eixos de papel.
--
-- Hoje a coluna `membros.papel` mistura dois conceitos (admin | ministro | vocal |
-- membro). A spec 02 (decisão D-02.1 = opção B) separa em DOIS eixos:
--   • papel_org        — organizacional: administrador | lider | membro (permissões)
--   • papel_ministerio — musical: ministro | vocal | instrumentista (escalas), pode ser null
--
-- Mapeamento (D-02.3): admin→administrador; ministro/vocal/membro→membro. Os poderes do
-- ministro sobre escala/repertório vêm do eixo MUSICAL (papel_ministerio='ministro'),
-- não do organizacional. Vocal vira papel_ministerio='vocal'.
--
-- A coluna legada `papel` é MANTIDA por compatibilidade durante a migração (JWT, frontend
-- e checagens antigas ainda a leem). Será removida num passo futuro de limpeza.

-- Up Migration

ALTER TABLE membros
  ADD COLUMN papel_org TEXT NOT NULL DEFAULT 'membro'
    CHECK (papel_org IN ('administrador', 'lider', 'membro'));

ALTER TABLE membros
  ADD COLUMN papel_ministerio TEXT
    CHECK (papel_ministerio IN ('ministro', 'vocal', 'instrumentista'));

-- Deriva os dois eixos a partir do papel legado.
UPDATE membros SET papel_org = 'administrador' WHERE papel = 'admin';
UPDATE membros SET papel_ministerio = 'ministro' WHERE papel = 'ministro';
UPDATE membros SET papel_ministerio = 'vocal'    WHERE papel = 'vocal';
-- 'membro' e 'admin' ficam com papel_ministerio = NULL (não são papéis musicais).

-- Down Migration

ALTER TABLE membros DROP COLUMN papel_ministerio;
ALTER TABLE membros DROP COLUMN papel_org;
