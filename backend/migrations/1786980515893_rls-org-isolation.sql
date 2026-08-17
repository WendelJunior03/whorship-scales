-- Multi-tenant · Passo 4 (spec 01): isolamento por organização com Row-Level Security.
--
-- Camada de DEFESA EM PROFUNDIDADE (decisão de implementação — "App + RLS"):
--   1) A aplicação injeta `app.current_org` em cada request (ver src/config/database.ts).
--   2) O Postgres FORÇA o filtro por org via políticas RLS — se um WHERE escapar no
--      código, o banco ainda barra o vazamento (fail-closed).
--
-- Como o RLS "enxerga" a org atual: a sessão define o GUC `app.current_org`
-- (SET LOCAL dentro de cada transação). As políticas comparam `org_id` com esse
-- valor. Sem o GUC (rota pré-auth), a comparação vira NULL → ZERO linhas.
--
-- Operações cross-tenant legítimas (login por email, buscar org por código, checar
-- unicidade de código, criar organização) usam o GUC `app.bypass_rls = 'on'`, setado
-- APENAS por código de sistema confiável (nunca a partir de input do usuário).
--
-- ⚠️ Superusuário do Postgres IGNORA RLS (mesmo com FORCE). Por isso o app roda como
-- um role dedicado NÃO-superusuário (`deepscales_app`); migrations/seed rodam como admin.

-- Up Migration

-- 1) Role dedicado da aplicação (não-superusuário → sujeito a RLS).
--    Senha de DEV; em produção (Neon) troque por uma senha forte via console/ALTER ROLE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'deepscales_app') THEN
    CREATE ROLE deepscales_app LOGIN PASSWORD 'deepscales_app_dev';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO deepscales_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO deepscales_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO deepscales_app;
-- Tabelas/sequences futuras já nascem acessíveis para o role do app.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO deepscales_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO deepscales_app;

-- 2) RLS nas 8 tabelas de dados (têm coluna org_id).
--    - ENABLE + FORCE: todo mundo (inclusive dono não-superusuário) fica sujeito.
--    - DEFAULT em org_id: INSERT sem org_id herda a org da sessão (injeção centralizada,
--      sem espalhar org_id em cada INSERT — decisão D-01.1).
--    - POLICY org_isolation: leitura/escrita só na org atual (ou bypass de sistema).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'membros', 'cultos', 'escala_fixa', 'escala_vocal',
    'escala_avulsa', 'excecoes', 'repertorio', 'notificacoes'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    -- NULLIF: uma conexão do pool que já serviu um request escopado deixa o GUC
    -- DEFINIDO-mas-vazio ('') ao fim da transação. '' ::int estoura; NULLIF vira NULL
    -- (INSERT sem org na sessão falha no NOT NULL — correto, fail-closed).
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN org_id SET DEFAULT NULLIF(current_setting(''app.current_org'', true), '''')::int',
      t
    );
    -- NULLIF também nas policies: sem ele, '' ::int estoura ANTES do OR bypass
    -- short-circuitar (Postgres não garante ordem de avaliação do OR).
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

-- 3) A própria tabela `organizacoes` (não tem org_id — ELA é o tenant): um usuário só
--    enxerga a própria org. Entrar por código / criar org são cross-tenant → usam bypass.
ALTER TABLE organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizacoes FORCE ROW LEVEL SECURITY;
CREATE POLICY org_self ON organizacoes
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR id = NULLIF(current_setting('app.current_org', true), '')::int
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR id = NULLIF(current_setting('app.current_org', true), '')::int
  );

-- Down Migration

DROP POLICY IF EXISTS org_self ON organizacoes;
ALTER TABLE organizacoes NO FORCE ROW LEVEL SECURITY;
ALTER TABLE organizacoes DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'membros', 'cultos', 'escala_fixa', 'escala_vocal',
    'escala_avulsa', 'excecoes', 'repertorio', 'notificacoes'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS org_isolation ON %I', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN org_id DROP DEFAULT', t);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM deepscales_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM deepscales_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM deepscales_app;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM deepscales_app;
REVOKE USAGE ON SCHEMA public FROM deepscales_app;
DROP ROLE IF EXISTS deepscales_app;
