-- Referência opcional ao culto de origem de uma notificação (ex.: recusa de
-- escala) — permite o app levar quem toca a notificação direto pra tela do
-- culto certo, em vez de só mostrar o texto.

-- Up Migration

ALTER TABLE notificacoes ADD COLUMN culto_id INTEGER REFERENCES cultos(id) ON DELETE SET NULL;

-- Down Migration

ALTER TABLE notificacoes DROP COLUMN culto_id;
