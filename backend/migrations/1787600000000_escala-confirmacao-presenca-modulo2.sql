-- Módulo 2 (spec 11) · T-11.6: confirmação de presença e registro de faltas.
--
-- Padroniza os valores de `status` das escalas com um CHECK e adiciona o rastro
-- `confirmado_em` (quando o membro confirmou). Reaproveita a coluna `status` que já
-- existe em escala_vocal/escala_avulsa (valores até aqui: pendente/confirmado/recusado);
-- acrescenta 'falta' (líder marca ausência). Aditivo e não destrutivo.

-- Up Migration

ALTER TABLE escala_vocal
  ADD CONSTRAINT escala_vocal_status_check
  CHECK (status IN ('pendente', 'confirmado', 'recusado', 'falta'));
ALTER TABLE escala_avulsa
  ADD CONSTRAINT escala_avulsa_status_check
  CHECK (status IN ('pendente', 'confirmado', 'recusado', 'falta'));

ALTER TABLE escala_vocal   ADD COLUMN confirmado_em TIMESTAMPTZ;
ALTER TABLE escala_avulsa  ADD COLUMN confirmado_em TIMESTAMPTZ;

-- Down Migration

ALTER TABLE escala_avulsa  DROP COLUMN confirmado_em;
ALTER TABLE escala_vocal   DROP COLUMN confirmado_em;

ALTER TABLE escala_avulsa DROP CONSTRAINT escala_avulsa_status_check;
ALTER TABLE escala_vocal  DROP CONSTRAINT escala_vocal_status_check;
