-- Módulo 1 (spec 11) · parte 1/2: schema de Ministérios.
--
-- Cria a entidade `ministerios` como sub-unidade da organização (decisão D-11.1) e
-- suas estruturas: vínculo N:N com membros, funções (papéis musicais reutilizáveis nas
-- escalas), equipes, classificações e as tabelas de junção. Tudo nasce multi-tenant:
-- coluna `org_id` + índice + RLS por org (mesmo padrão do Passo 4 / musicas-videos).
--
-- Aditivo: NÃO mexe nas tabelas de escala/culto/repertório ainda (o `ministerio_id`
-- nelas é um passo separado, mais invasivo — ver spec 11, T-11.3). O backfill do
-- ministério "seed" por org e a derivação das funções ficam na parte 2/2.

-- Up Migration

CREATE TABLE ministerios (
  id           SERIAL PRIMARY KEY,
  org_id       INTEGER NOT NULL REFERENCES organizacoes(id),
  nome         TEXT NOT NULL,                       -- "Louvor IEQ Guarani"
  descricao    TEXT,
  vagas_gratis INTEGER NOT NULL DEFAULT 10,         -- base do modelo de vagas (D-11.2)
  vagas_extras INTEGER NOT NULL DEFAULT 0,          -- alocadas via assinatura (módulo 12)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vínculo N:N membro↔ministério (D-11.1). `papel` é o papel DENTRO do ministério
-- (admin do ministério pode gerir funções/equipes; ver capacidades em spec 02).
CREATE TABLE ministerio_membros (
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  membro_id     INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  papel         TEXT NOT NULL DEFAULT 'membro' CHECK (papel IN ('administrador', 'membro')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ministerio_id, membro_id)
);

-- Funções musicais do ministério (Ministro, Vocalista, Teclado, Violão...).
CREATE TABLE funcoes (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  icone         TEXT
);

-- Funções que cada membro exerce (num ministério).
CREATE TABLE membro_funcoes (
  membro_id     INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  funcao_id     INTEGER NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  PRIMARY KEY (membro_id, funcao_id)
);

CREATE TABLE equipes (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL
);

CREATE TABLE equipe_membros (
  equipe_id INTEGER NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  org_id    INTEGER NOT NULL REFERENCES organizacoes(id),
  PRIMARY KEY (equipe_id, membro_id)
);

CREATE TABLE classificacoes (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizacoes(id),
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,                       -- ex.: Titular, Reserva
  cor           TEXT
);

CREATE TABLE membro_classificacao (
  membro_id        INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  classificacao_id INTEGER NOT NULL REFERENCES classificacoes(id) ON DELETE CASCADE,
  org_id           INTEGER NOT NULL REFERENCES organizacoes(id),
  PRIMARY KEY (membro_id, classificacao_id)
);

-- Índices (org_id em todas + FKs mais consultadas).
CREATE INDEX idx_ministerios_org           ON ministerios (org_id);
CREATE INDEX idx_ministerio_membros_org    ON ministerio_membros (org_id);
CREATE INDEX idx_ministerio_membros_membro ON ministerio_membros (membro_id);
CREATE INDEX idx_funcoes_org               ON funcoes (org_id);
CREATE INDEX idx_funcoes_ministerio        ON funcoes (ministerio_id);
CREATE INDEX idx_membro_funcoes_org        ON membro_funcoes (org_id);
CREATE INDEX idx_membro_funcoes_ministerio ON membro_funcoes (ministerio_id);
CREATE INDEX idx_membro_funcoes_funcao     ON membro_funcoes (funcao_id);
CREATE INDEX idx_equipes_org               ON equipes (org_id);
CREATE INDEX idx_equipes_ministerio        ON equipes (ministerio_id);
CREATE INDEX idx_equipe_membros_org        ON equipe_membros (org_id);
CREATE INDEX idx_equipe_membros_membro     ON equipe_membros (membro_id);
CREATE INDEX idx_classificacoes_org        ON classificacoes (org_id);
CREATE INDEX idx_classificacoes_ministerio ON classificacoes (ministerio_id);
CREATE INDEX idx_membro_classificacao_org  ON membro_classificacao (org_id);

-- Acesso do role da aplicação (as default privileges do Passo 4 já cobririam; explícito
-- por segurança/legibilidade, igual à migration musicas-videos).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  ministerios, ministerio_membros, funcoes, membro_funcoes,
  equipes, equipe_membros, classificacoes, membro_classificacao
  TO deepscales_app;
GRANT USAGE, SELECT ON SEQUENCE
  ministerios_id_seq, funcoes_id_seq, equipes_id_seq, classificacoes_id_seq
  TO deepscales_app;

-- RLS (isolamento por org) — mesmo padrão do Passo 4: ENABLE+FORCE, DEFAULT de org_id
-- vindo da sessão (app.current_org) e policy org_isolation (com bypass de sistema).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ministerios', 'ministerio_membros', 'funcoes', 'membro_funcoes',
    'equipes', 'equipe_membros', 'classificacoes', 'membro_classificacao'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting(''app.current_org'', true), '''')::int',
      t
    );
    EXECUTE format($f$
      CREATE POLICY org_isolation ON %I
        USING (
          current_setting('app.bypass_rls', true) = 'on'
          OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
        )
        WITH CHECK (
          current_setting('app.bypass_rls', true) = 'on'
          OR org_id = NULLIF(current_setting('app.current_org', true), '')::int
        )
    $f$, t);
  END LOOP;
END
$$;

-- Down Migration

DROP POLICY IF EXISTS org_isolation ON membro_classificacao;
DROP POLICY IF EXISTS org_isolation ON classificacoes;
DROP POLICY IF EXISTS org_isolation ON equipe_membros;
DROP POLICY IF EXISTS org_isolation ON equipes;
DROP POLICY IF EXISTS org_isolation ON membro_funcoes;
DROP POLICY IF EXISTS org_isolation ON funcoes;
DROP POLICY IF EXISTS org_isolation ON ministerio_membros;
DROP POLICY IF EXISTS org_isolation ON ministerios;

DROP TABLE IF EXISTS membro_classificacao;
DROP TABLE IF EXISTS classificacoes;
DROP TABLE IF EXISTS equipe_membros;
DROP TABLE IF EXISTS equipes;
DROP TABLE IF EXISTS membro_funcoes;
DROP TABLE IF EXISTS funcoes;
DROP TABLE IF EXISTS ministerio_membros;
DROP TABLE IF EXISTS ministerios;
