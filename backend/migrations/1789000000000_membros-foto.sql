-- Foto de perfil do membro.
--
-- `foto_url` guarda OU a URL da foto do Google (quando o login é social) OU uma
-- imagem reduzida em data URL (`data:image/...;base64,...`) quando o membro sobe a
-- própria foto (decisão do dono: sem storage externo na v1). A tabela membros já
-- tem RLS (isolamento por org) — só adicionamos uma coluna.

-- Up Migration

ALTER TABLE membros ADD COLUMN foto_url TEXT;

-- Down Migration

ALTER TABLE membros DROP COLUMN IF EXISTS foto_url;
