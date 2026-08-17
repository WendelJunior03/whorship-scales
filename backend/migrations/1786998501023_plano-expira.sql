-- Plano PRO · Passo 6 (spec 03): esqueleto de assinatura.
--
-- A coluna `plano` (free|pro) já existe (Passo 2). Aqui só adicionamos `plano_expira`
-- para uma assinatura futura poder marcar até quando o PRO vale. Integração de
-- pagamento (gateway/webhooks/cobrança) fica FORA do escopo desta fase — isto é só
-- a estrutura que a cobrança vai usar depois.

-- Up Migration

ALTER TABLE organizacoes ADD COLUMN plano_expira TIMESTAMPTZ;

-- Down Migration

ALTER TABLE organizacoes DROP COLUMN plano_expira;
