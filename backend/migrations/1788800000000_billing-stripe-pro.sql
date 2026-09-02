-- Billing real (Stripe) · plano PRO por organização.
--
-- Modelo freemium: Free = limitado (10 por ministério + recursos parciais);
-- PRO = vagas ilimitadas + todos os recursos. `organizacoes.plano` (free/pro) já
-- existe e é a FONTE DA VERDADE — estas colunas guardam o vínculo com o Stripe e o
-- estado da assinatura, atualizados pelos webhooks. Substitui o antigo pacote de
-- vagas avulso (módulo 12). Sem dado sensível: são refs opacas do Stripe.

-- Up Migration

ALTER TABLE organizacoes
  ADD COLUMN stripe_customer_id     TEXT,          -- cus_... (cliente no Stripe)
  ADD COLUMN stripe_subscription_id TEXT,          -- sub_... (assinatura ativa)
  ADD COLUMN plano_status           TEXT,          -- active | trialing | past_due | canceled | null
  ADD COLUMN plano_ciclo            TEXT,          -- mensal | anual | null
  ADD COLUMN plano_expira_em        TIMESTAMPTZ;   -- fim do período atual pago

-- Busca por customer no webhook (cross-tenant, via bypass) precisa ser rápida e o
-- valor é único por org.
CREATE UNIQUE INDEX organizacoes_stripe_customer_id_key
  ON organizacoes (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Down Migration

DROP INDEX IF EXISTS organizacoes_stripe_customer_id_key;
ALTER TABLE organizacoes
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS plano_status,
  DROP COLUMN IF EXISTS plano_ciclo,
  DROP COLUMN IF EXISTS plano_expira_em;
