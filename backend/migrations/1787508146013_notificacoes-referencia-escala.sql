-- Referência opcional à escala (vocal/avulsa) de origem de uma notificação de
-- "nova escala publicada" — permite o app mostrar Confirmar/Recusar direto na
-- notificação, sem precisar ir na aba de Compromissos.

-- Up Migration

ALTER TABLE notificacoes ADD COLUMN referencia_tipo TEXT;
ALTER TABLE notificacoes ADD COLUMN referencia_id INTEGER;

-- Down Migration

ALTER TABLE notificacoes DROP COLUMN referencia_tipo;
ALTER TABLE notificacoes DROP COLUMN referencia_id;
