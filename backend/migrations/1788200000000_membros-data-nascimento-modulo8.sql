-- Módulo 8 (spec 11) · T-11.24: data de nascimento do membro (aniversariantes).
--
-- Coluna opcional em `membros`. Alimenta a lista/calendário de aniversariantes
-- do mês (por org/ministério). Sem PII sensível além do que já aparece no perfil.

-- Up Migration

ALTER TABLE membros ADD COLUMN data_nascimento DATE;

-- Down Migration

ALTER TABLE membros DROP COLUMN IF EXISTS data_nascimento;
