-- Módulo 8 (spec 11) · T-11.24: aniversariantes.
--
-- Adiciona `data_nascimento` (opcional) em `membros` — usada pelo endpoint de
-- aniversariantes do mês (T-11.25). Sem tabela nova: é só uma coluna a mais no
-- cadastro existente.

-- Up Migration

ALTER TABLE membros ADD COLUMN data_nascimento DATE;

-- Down Migration

ALTER TABLE membros DROP COLUMN data_nascimento;
