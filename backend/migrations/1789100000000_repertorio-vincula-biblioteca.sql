-- Vincula o Repertório (lista simples por culto) à Biblioteca (catálogo de músicas).
--
-- Ao adicionar uma música no Repertório de um culto, o backend agora tenta achar uma
-- música já cadastrada na Biblioteca com o mesmo nome (reaproveita) e, se não achar,
-- cria uma nova ali — usando o link já colado no Repertório (capa + áudio) e o mesmo
-- buscador de metadados (artista) da Biblioteca. `musica_id` fica null pra linhas já
-- existentes (sem migração retroativa, por decisão do dono — só vale daqui pra frente).

-- Up Migration

ALTER TABLE repertorio ADD COLUMN musica_id INTEGER REFERENCES musicas(id) ON DELETE SET NULL;
CREATE INDEX idx_repertorio_musica ON repertorio (musica_id);

-- Down Migration

DROP INDEX IF EXISTS idx_repertorio_musica;
ALTER TABLE repertorio DROP COLUMN IF EXISTS musica_id;
