-- Módulo 10 (spec 11): capa da música derivada do link de áudio.
--
-- `capa_url` é preenchida a partir do `audio_url` quando ele é um link do
-- YouTube (thumbnail pelo id) ou do Spotify (via oEmbed público). Guardada aqui
-- pra ser calculada uma vez e exibida em qualquer tela, sem fetch por render.

-- Up Migration

ALTER TABLE musicas ADD COLUMN capa_url TEXT;

-- Down Migration

ALTER TABLE musicas DROP COLUMN IF EXISTS capa_url;
