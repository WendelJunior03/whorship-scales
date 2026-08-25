-- Módulo 1 (spec 11) · T-11.3 (parte 3/4): liga escalas/cultos/repertório ao ministério.
--
-- Passo invasivo adiado no schema inicial (ver comentário da migration
-- 1787200000000): adiciona `ministerio_id` às tabelas de escala/culto/repertório e
-- `funcao_id` (FK -> funcoes) onde hoje existe a coluna livre `funcao` (texto).
--
-- Estratégia (mesma do multi-tenant, Passo 2): colunas NULLABLE aqui; o backfill dos
-- registros existentes fica na parte 4/4 (data migration seguinte). NÃO enforço NOT NULL
-- nem removo a coluna `funcao` (texto) — a remoção é destrutiva e os models ainda leem
-- `funcao`; a coluna vira legado e o `funcao_id` passa a ser a fonte canônica quando os
-- fluxos de escala forem migrados. RLS já existe nessas tabelas (por org_id); as colunas
-- novas não precisam de policy própria.

-- Up Migration

-- ministerio_id (funcional; o org_id continua sendo a chave de RLS).
ALTER TABLE cultos        ADD COLUMN ministerio_id INTEGER REFERENCES ministerios(id);
ALTER TABLE escala_fixa   ADD COLUMN ministerio_id INTEGER REFERENCES ministerios(id);
ALTER TABLE escala_vocal  ADD COLUMN ministerio_id INTEGER REFERENCES ministerios(id);
ALTER TABLE escala_avulsa ADD COLUMN ministerio_id INTEGER REFERENCES ministerios(id);
ALTER TABLE repertorio    ADD COLUMN ministerio_id INTEGER REFERENCES ministerios(id);

-- funcao_id: substitui gradualmente a coluna livre `funcao` (texto) nas escalas que a têm.
ALTER TABLE escala_fixa   ADD COLUMN funcao_id INTEGER REFERENCES funcoes(id);
ALTER TABLE escala_avulsa ADD COLUMN funcao_id INTEGER REFERENCES funcoes(id);

-- Índices para os JOINs/filtros por ministério e função.
CREATE INDEX idx_cultos_ministerio        ON cultos (ministerio_id);
CREATE INDEX idx_escala_fixa_ministerio   ON escala_fixa (ministerio_id);
CREATE INDEX idx_escala_vocal_ministerio  ON escala_vocal (ministerio_id);
CREATE INDEX idx_escala_avulsa_ministerio ON escala_avulsa (ministerio_id);
CREATE INDEX idx_repertorio_ministerio    ON repertorio (ministerio_id);
CREATE INDEX idx_escala_fixa_funcao       ON escala_fixa (funcao_id);
CREATE INDEX idx_escala_avulsa_funcao     ON escala_avulsa (funcao_id);

-- Down Migration

DROP INDEX IF EXISTS idx_escala_avulsa_funcao;
DROP INDEX IF EXISTS idx_escala_fixa_funcao;
DROP INDEX IF EXISTS idx_repertorio_ministerio;
DROP INDEX IF EXISTS idx_escala_avulsa_ministerio;
DROP INDEX IF EXISTS idx_escala_vocal_ministerio;
DROP INDEX IF EXISTS idx_escala_fixa_ministerio;
DROP INDEX IF EXISTS idx_cultos_ministerio;

ALTER TABLE escala_avulsa DROP COLUMN funcao_id;
ALTER TABLE escala_fixa   DROP COLUMN funcao_id;

ALTER TABLE repertorio    DROP COLUMN ministerio_id;
ALTER TABLE escala_avulsa DROP COLUMN ministerio_id;
ALTER TABLE escala_vocal  DROP COLUMN ministerio_id;
ALTER TABLE escala_fixa   DROP COLUMN ministerio_id;
ALTER TABLE cultos        DROP COLUMN ministerio_id;
