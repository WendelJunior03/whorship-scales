# 11 — Novas Funcionalidades (paridade de produto)

## Objetivo

Consolidar num só documento o conjunto de funcionalidades que o produto precisa ganhar
para chegar à paridade com apps de referência do mesmo nicho (gestão de escalas de louvor).
Cada módulo abaixo traz **o que entrega**, **o que muda no banco** (tabelas/colunas novas)
e **tarefas** com "definição de pronto".

> ⚠️ **Fundação primeiro.** Vários módulos aqui dependem de multi-tenant (spec 01),
> RBAC (spec 02) e do catálogo `musicas`/`videos` (spec 08) que **já existem no schema**
> (`org_id` em todas as tabelas + RLS por organização). **Toda tabela nova nasce
> multi-tenant**: coluna `org_id NOT NULL`, índice em `org_id` e **política RLS** no mesmo
> padrão da migration `1787085042917_musicas-videos.sql` (isolamento por
> `app.current_org`). Não repetir o SQL de RLS em cada seção — assume-se esse padrão.

> 🧩 **Escopo desta spec = "o quê" e "modelo de dados".** O detalhamento de UI e de
> endpoints entra na implementação de cada módulo. Decisões de produto em aberto estão
> marcadas com **`Decisão: ⬜ pendente`** e trazem recomendação — precisam ser batidas
> pelo dono antes de implementar.

---

## Contexto atual (o que já existe no schema)

- `organizacoes` (tenant), `membros` (com `papel_org` + `papel_ministerio`, `org_id`).
- `cultos`, `escala_fixa`, `escala_vocal`, `escala_avulsa`, `excecoes` — o núcleo de escalas.
  - `escala_vocal` e `escala_avulsa` já têm `status` (`pendente` por padrão) → base da
    **confirmação de presença**.
- `repertorio` (por culto: `nome`, `tom`, `link_musica`) e o catálogo novo `musicas`
  (`nome`, `tom_padrao`, `bpm`) + `videos` (YouTube por categoria).
- `notificacoes` (por membro) → base dos **Avisos** e das notificações de confirmação.
- RLS por `org_id` ativa (isolamento garantido pelo banco).

**Lacunas** (o que ainda não existe e estas funcionalidades exigem): entidade
**Ministério** e suas sub-estruturas (equipes/funções/classificações), **roteiro
cronometrado**, **comentários por escala**, **histórico de alterações**,
**indisponibilidades**, **aniversariantes** (falta `data_nascimento`), **pastas/artistas**
no repertório, **contas vinculadas/integrações**, e o **modelo de cobrança por vaga**.

---

## Decisões-chave (transversais)

### D-11.1 — "Ministério" como entidade dentro da organização

As telas de referência tratam **Ministério** como uma unidade com membros próprios
(ex.: "6/20 membros"), **Equipes**, **Funções**, **Classificações** e **Integrações**, e o
usuário pode ter **mais de um ministério**. Hoje o tenant é a **organização** (`org_id` em
tudo) e a decisão D-01.4 fixou **1 organização por usuário**.

| Opção | Como | Prós | Contras |
|-------|------|------|---------|
| **A. Ministério = a própria organização** | Não cria entidade nova; "ministério" é só o nome de exibição da org | Zero mudança de schema | Não suporta N ministérios por igreja nem vagas por ministério; contradiz as telas |
| **B. `ministerios` como sub-entidade de `organizacoes`** | Nova tabela `ministerios (org_id)`; membros pertencem a ministérios via tabela de junção; escalas/repertório passam a ter `ministerio_id` | Representa a realidade (igreja com vários ministérios); habilita vagas por ministério e a aprovação de ingresso por ministério (D-01.5) | Mudança estrutural: `ministerio_id` em várias tabelas; queries e RLS ganham mais um escopo |

> **Recomendação: B.** É o que sustenta o ingresso **por ministério** (spec 01, D-01.5), a
> cobrança **por vaga/ministério** (D-11.2) e o multi-ministério das telas. Manter `org_id`
> como escopo de isolamento (RLS) e `ministerio_id` como escopo funcional dentro da org.

**Decisão: ✅ B — `ministerios` como sub-entidade da org, com vínculo N:N.** Cada
organização (igreja) tem vários ministérios; um membro pode servir em **mais de um**
(tabela `ministerio_membros`), coerente com "Meus ministérios". `org_id` continua sendo o
escopo de isolamento (RLS); `ministerio_id` é o escopo funcional dentro da org.

---

### D-11.2 — Modelo de monetização: por vaga/assento vs. plano PRO por feature

A spec 03 definiu **Free vs PRO com feature flags** (trava *recursos*). As telas de
referência cobram por **vagas/assentos por ministério** (trava *tamanho da equipe*): cada
ministério tem **10 membros grátis**; pacotes de vagas extras são comprados e
**distribuídos entre os ministérios** (ex.: `+10 vagas` por R$14,99/mês, mensal/anual).

| Opção | Trava | Prós | Contras |
|-------|-------|------|---------|
| **A. Feature flags Free/PRO (spec 03)** | Recursos (módulos) | Já especificado; simples de comunicar | Não limita tamanho de equipe; receita não escala com o uso |
| **B. Assentos por ministério** | Nº de membros | Receita escala com a igreja; alinhado às telas | Precisa de contagem/limite por ministério + billing de assinatura |
| **C. Híbrido** | Recursos **e** assentos | Flexível | Dois eixos de cobrança para comunicar/implementar |

**Decisão: ✅ C — Híbrido (vagas por ministério + PRO por feature).** A base é **vagas/
assentos por ministério** (10 grátis por ministério + pacotes extras distribuíveis), e
**alguns módulos continuam travados como PRO** (feature flags da spec 03). Ou seja, os dois
eixos coexistem e são **ortogonais**: um recurso pode exigir *ter vaga disponível* **e**
*plano PRO*. Consequências:
- Esta spec adiciona `assinaturas` + `vagas` (módulo 12) e a regra de limite por ministério.
- A **spec 03** passa a ser "feature flags PRO **+** billing de assentos" — atualizar lá o
  escopo (o catálogo de recursos PRO continua; ganha a dimensão de vagas).
- Definir na implementação **quais módulos** ficam atrás de PRO vs. liberados no Free
  (candidatos a PRO: integrações pesadas, histórico estendido, panorama avançado).

---

## Módulos

### Módulo 1 — Ministérios, Equipes, Funções e Classificações

**Entrega:** ministério como unidade com aba **Informações** e **Membros (x/y)**; dentro,
**Equipes** (agrupamento de membros), **Funções** (Ministro, Vocalista, Teclado, Violão…
= papéis musicais reutilizáveis nas escalas) e **Classificações** (níveis/tags, ex.:
titular/reserva). Integrações e "Sair do ministério".

**Banco (novo):**
```
ministerios
  id            PK
  org_id        FK -> organizacoes.id   NOT NULL
  nome          TEXT NOT NULL           -- "Louvor IEQ Guarani"
  descricao     TEXT
  vagas_gratis  INTEGER NOT NULL DEFAULT 10   -- base do modelo de vagas (D-11.2)
  vagas_extras  INTEGER NOT NULL DEFAULT 0    -- alocadas via assinatura (módulo 12)
  created_at    timestamptz

ministerio_membros                      -- vínculo N:N (D-11.1)
  ministerio_id FK -> ministerios.id
  membro_id     FK -> membros.id
  papel         TEXT   -- 'administrador' | 'membro' (admin DO ministério; ver RBAC spec 02)
  created_at    timestamptz
  PRIMARY KEY (ministerio_id, membro_id)

equipes            (id, org_id, ministerio_id, nome)
equipe_membros     (equipe_id, membro_id, PRIMARY KEY (...))
funcoes            (id, org_id, ministerio_id, nome, icone)   -- Ministro, Vocalista, Teclado, Violão...
membro_funcoes     (membro_id, funcao_id, ministerio_id)      -- funções que o membro exerce
classificacoes     (id, org_id, ministerio_id, nome, cor)     -- ex.: Titular, Reserva
membro_classificacao (membro_id, classificacao_id)
```
> **Impacto:** escalas (`escala_fixa`, `escala_vocal`, `escala_avulsa`, `cultos`,
> `repertorio`) passam a ter **`ministerio_id`** (funcional; `org_id` continua p/ RLS). A
> coluna livre `funcao` (texto) migra para FK `funcao_id`. `papel_ministerio` de `membros`
> pode ser derivado/substituído por `membro_funcoes` (decidir na implementação).

**Tarefas:**
- [x] **T-11.1** — ✅ Migration `1787200000000_ministerios-modulo1-schema.sql`: `ministerios`
  + `ministerio_membros` (N:N) com RLS por org.
- [x] **T-11.2** — ✅ Mesma migration: `funcoes`, `membro_funcoes`, `equipes`,
  `equipe_membros`, `classificacoes`, `membro_classificacao` (todas com RLS + índices + grants).
- [x] **T-11.3** — ✅ Backfill `1787200000001_...-backfill.sql`: cria um ministério
  inicial por org, vincula membros ativos e deriva funções de `papel_ministerio`; criação de
  org nova também nasce com ministério padrão (`organizacaoModel`). ✅ `ministerio_id` nas
  tabelas de escala/culto/repertório e `funcao_id` (FK) em `escala_fixa`/`escala_avulsa` via
  `1787200000002_...-escala-ministerio-id-schema.sql` (colunas nullable + índices) +
  `1787200000003_...-escala-ministerio-id-backfill.sql` (liga ao ministério seed da org,
  cria funções faltantes a partir do `funcao` texto legado e preenche `funcao_id`). Coluna
  `funcao` (texto) mantida como legado (remoção seria destrutiva). NOT NULL adiado até os
  fluxos de escala passarem a gravar as colunas novas.
- [x] **T-11.4** — ✅ Backend completo de **ministério + membros + funções + equipes +
  classificações** (`ministerioModel`/`Controller`/`Routes`, montado em `/ministerios`),
  capacidades `ministerio.visualizar` / `.gerenciar` / `.membros.gerenciar`, limite de vagas
  ao adicionar membro, e validações de posse (equipe/classificação pertencem ao ministério;
  membro pertence à org via RLS). Smoke test HTTP de ponta a ponta: 8/8.
- [x] **T-11.5** — ✅ Tela **Ministério** (`MinisterioScreen`) com abas **Informações**
  (identidade, barra de vagas x/y, listas de equipes/funções/classificações, integrações
  Holyrics/API bloqueadas) e **Membros (x/y)**. **Ações de gestão pela UI** (admin/líder):
  adicionar/remover membro, criar/apagar função/equipe/classificação e atribuir/remover
  função de um membro (chips). Serviço `ministeriosService` + tipos; entrada em
  **Recursos → Gestão** + rota na stack. Type-check e lint limpos.
  ✅ **Completo:** gerir *membros de uma equipe* (modal ao tocar na equipe: adiciona/remove
  membros do ministério) e *atribuir/remover classificação de um membro* pela UI (chips no
  modal do membro, espelhando as funções). Backend passou a devolver `classificacoes` do
  membro em `listarMembros`.

> ✅ **Verificação:** migrations aplicadas com sucesso (schema + backfill) num banco local;
> type-check limpo; suíte verde com **81 testes** — incluindo os 6 de isolamento (RLS) que
> rodaram contra o banco. Backfill conferido: 1 ministério por org, membros vinculados com
> papel derivado do `papel_org` e funções derivadas de `papel_ministerio`.

---

### Módulo 2 — Confirmação de presença e Registro de faltas

**Entrega:** participante **Confirma** presença na escala; líder vê "Confirmados (3 de 4)"
e usa **Registrar faltas**. Notifica quem precisa confirmar.

**Banco:** reaproveita `status` de `escala_vocal`/`escala_avulsa`. Padronizar os valores e
adicionar rastro:
```
-- em escala_vocal e escala_avulsa:
status          -> CHECK (status IN ('pendente','confirmado','recusado','falta'))
confirmado_em   timestamptz NULL
```
> **Impacto:** notificação ao membro pedindo confirmação (usa `notificacoes`).

**Tarefas:**
- [x] **T-11.6** — ✅ Migration `1787600000000_escala-confirmacao-presenca-modulo2.sql`:
  `CHECK (status IN ('pendente','confirmado','recusado','falta'))` + `confirmado_em` nas duas
  tabelas de escala.
- [x] **T-11.7** — ✅ Confirmar/recusar (membro) já existiam da fase B; agora `updateStatus*`
  seta/limpa `confirmado_em`, e há **novo endpoint `POST /escala-vocal|escala-avulsa/:id/falta`**
  (líder registra falta → status `falta` + notificação tipo `falta` ao membro), protegido por
  `escala.gerenciar`. Sem notificação nova de "confirme presença": a de "nova escala publicada"
  (com `referencia_tipo/id`) já habilita Confirmar/Recusar na aba de Notificações.
- [~] **T-11.8** — UI: painel "Confirmados x de y" + ação Registrar falta na `DetalhesCultoScreen`;
  status `falta` no app (badge/ícone). *(em andamento)*

---

### Módulo 3 — Roteiro da escala (setlist cronometrado)

**Entrega:** aba **Roteiro** com as músicas na ordem, cada uma com **duração** e o **tempo
total** do culto; itens que não são música (oração, avisos) também entram no roteiro.

**Banco (novo):**
```
roteiro_itens
  id           PK
  org_id       FK   NOT NULL
  culto_id     FK -> cultos.id   NOT NULL
  ordem        INTEGER NOT NULL          -- 1,2,3...
  tipo         TEXT NOT NULL             -- 'musica' | 'momento'
  musica_id    FK -> musicas.id NULL     -- quando tipo='musica'
  titulo       TEXT                      -- rótulo livre (momentos) ou override
  duracao_seg  INTEGER                   -- 223 = 3:43
  tom          TEXT                      -- tom escolhido para ESTE culto
  created_at   timestamptz
```
> **Impacto:** substitui/estende o `repertorio` atual (que hoje guarda nome/tom/link soltos
> por culto). Migrar itens de `repertorio` para `roteiro_itens` (tipo='musica').

**Tarefas:**
- [ ] **T-11.9** — Migration `roteiro_itens` + migração dos dados de `repertorio`.
- [ ] **T-11.10** — CRUD do roteiro (ordenar, definir tom/duração por culto) + soma de tempo.
- [ ] **T-11.11** — UI: aba Roteiro (lista ordenável com duração e total) e aba Músicas (tom + YouTube).

---

### Módulo 4 — Comentários por escala

**Entrega:** chat/thread de comentários dentro de cada escala/culto.

**Banco (novo):**
```
escala_comentarios
  id          PK
  org_id      FK   NOT NULL
  culto_id    FK -> cultos.id   NOT NULL
  membro_id   FK -> membros.id  NOT NULL
  texto       TEXT NOT NULL
  created_at  timestamptz
```
**Tarefas:**
- [ ] **T-11.12** — Migration `escala_comentarios` (RLS por org).
- [ ] **T-11.13** — Endpoints listar/criar comentário + notificação aos participantes.
- [ ] **T-11.14** — UI: aba Comentários (lista + campo "Digite aqui…").

---

### Módulo 5 — Histórico de alterações (audit log com expiração)

**Entrega:** log por escala ("Fulano confirmou", "Fulano adicionou Beltrano (Ministro,
Vocalista)"), com **quem**, **quando** e **o quê**, e aviso de que o histórico é **apagado
~1 semana após a data da escala**.

**Banco (novo):**
```
escala_historico
  id          PK
  org_id      FK   NOT NULL
  culto_id    FK -> cultos.id   NOT NULL
  ator_id     FK -> membros.id  NULL   -- quem fez a ação
  acao        TEXT NOT NULL            -- 'confirmou' | 'adicionou_membro' | 'removeu_membro' | ...
  detalhe     jsonb                    -- payload da mudança (nome/funções afetadas)
  created_at  timestamptz
  expira_em   timestamptz              -- data_escala + 7 dias (limpeza por job/cron)
```
> **Impacto:** decidir o gatilho de escrita (na camada de serviço a cada mutação de escala)
> e o mecanismo de expiração (job agendado que apaga `expira_em < now()`).

**Tarefas:**
- [ ] **T-11.15** — Migration `escala_historico`.
- [ ] **T-11.16** — Registrar eventos nas mutações de escala (adicionar/remover/confirmar).
- [ ] **T-11.17** — Job de expiração (apaga registros vencidos) + aviso na UI.
- [ ] **T-11.18** — UI: tela Histórico de alterações (timeline).

---

### Módulo 6 — Panorama de escalas (matriz função × data)

**Entrega:** grade do mês com **funções nas linhas** e **datas de culto nas colunas**,
avatares dos escalados nas células; filtros (equipe, extensa, todas as funções).

**Banco:** **sem tabelas novas** — é uma **visão de leitura** que cruza
`cultos` × `funcoes`/`membro_funcoes` × escalas do mês. Precisa de um endpoint agregador.

**Tarefas:**
- [ ] **T-11.19** — Endpoint de panorama (matriz por mês/ministério).
- [ ] **T-11.20** — UI: grade com filtros; toque na célula abre opções.

---

### Módulo 7 — Indisponibilidades

**Entrega:** membro marca **datas em que não pode servir**; escalação/sugestão respeita.

**Banco (novo):**
```
indisponibilidades
  id          PK
  org_id      FK   NOT NULL
  membro_id   FK -> membros.id  NOT NULL
  ministerio_id FK NULL              -- global (org) ou por ministério
  data_inicio DATE NOT NULL
  data_fim    DATE NOT NULL          -- = data_inicio para 1 dia
  motivo      TEXT
  created_at  timestamptz
```
> **Impacto:** a sugestão de escala (ex.: `sugerirVocais`) passa a filtrar quem está
> indisponível na data.

**Tarefas:**
- [ ] **T-11.21** — Migration `indisponibilidades`.
- [ ] **T-11.22** — CRUD (calendário) + integração com a sugestão de escala.
- [ ] **T-11.23** — UI: calendário de indisponibilidades.

---

### Módulo 8 — Aniversariantes

**Entrega:** calendário/lista de aniversariantes do mês.

**Banco (novo — coluna):**
```
-- em membros:
data_nascimento  DATE NULL     -- já aparece no perfil (ex.: 03/09/1996)
```
**Tarefas:**
- [ ] **T-11.24** — Migration: `membros.data_nascimento`.
- [ ] **T-11.25** — Endpoint aniversariantes do mês (por org/ministério) + UI (calendário/lista).

---

### Módulo 9 — Avisos (comunicados da organização)

**Entrega:** mural de **Avisos** (ex.: "Nova Atualização", "Assinaturas", "Seu feedback é
importante") com detalhe; distinto de `notificacoes` (pessoais).

**Banco (novo):**
```
avisos
  id          PK
  org_id      FK   NOT NULL
  ministerio_id FK NULL
  titulo      TEXT NOT NULL
  corpo       TEXT
  autor_id    FK -> membros.id NULL
  publicado_em timestamptz
  created_at  timestamptz

aviso_leituras  (aviso_id, membro_id, lido_em)   -- controle de lidos (opcional)
```
**Tarefas:**
- [ ] **T-11.26** — Migration `avisos` (+ `aviso_leituras`).
- [ ] **T-11.27** — CRUD (quem pode publicar via capacidade RBAC) + UI (lista + detalhe).

---

### Módulo 10 — Repertório: Pastas, Artistas e mídia da música

**Entrega:** repertório com abas **Músicas / Pastas / Artistas**; música com **artista**,
**tom**, **cifra** e **áudio/YouTube**; organização em **pastas**.

**Banco (novo/estende `musicas`):**
```
-- em musicas (estende o catálogo da spec 08):
artista      TEXT
cifra_url    TEXT           -- ou texto da cifra
audio_url    TEXT

pastas         (id, org_id, ministerio_id, nome)
pasta_musicas  (pasta_id, musica_id, PRIMARY KEY (...))
```
> **Artistas** = agregação por `musicas.artista` (não precisa de tabela própria na v1; virar
> tabela `artistas` só se houver foto/metadados por artista — decidir na implementação).

**Tarefas:**
- [ ] **T-11.28** — Migration: colunas `artista`/`cifra_url`/`audio_url` em `musicas` + `pastas`/`pasta_musicas`.
- [ ] **T-11.29** — UI: abas Músicas/Pastas/Artistas; tela da música com cifra/áudio/YouTube.

---

### Módulo 11 — Contas vinculadas e Integrações

**Entrega:** no perfil, **Contas vinculadas** (Login com Google, Login com Apple, WhatsApp,
Google Agenda); no ministério, **Integrações** (ex.: Holyrics, Tokens de API) restritas a
admin. **Google Agenda** sincroniza a escala; **WhatsApp** para avisos.

**Banco (novo):**
```
contas_vinculadas
  id          PK
  org_id      FK   NOT NULL
  membro_id   FK -> membros.id  NOT NULL
  provedor    TEXT NOT NULL      -- 'google' | 'apple' | 'whatsapp' | 'google_agenda'
  provedor_uid TEXT              -- id externo
  dados       jsonb              -- tokens/refs (⚠️ segredos: cifrar/guardar com cuidado)
  created_at  timestamptz
  UNIQUE (membro_id, provedor)

integracoes_ministerio
  id            PK
  org_id        FK   NOT NULL
  ministerio_id FK -> ministerios.id NOT NULL
  tipo          TEXT NOT NULL      -- 'holyrics' | 'api_token' | ...
  config        jsonb
  ativo         BOOLEAN NOT NULL DEFAULT true
  created_at    timestamptz

api_tokens
  id            PK
  org_id        FK   NOT NULL
  ministerio_id FK NULL
  nome          TEXT
  token_hash    TEXT NOT NULL      -- guardar só o HASH do token
  criado_por    FK -> membros.id
  ultimo_uso_em timestamptz
  created_at    timestamptz
```
**Decisão: ✅ Todas entram na v1** — **Login Google**, **Login Apple**, **Google Agenda**,
**WhatsApp**, **Holyrics** e **Tokens de API**. **Nenhum segredo em claro**: tokens/refresh
cifrados em repouso; de API guardar só o **hash** (ver seção Segurança do CLAUDE.md).
Prioridade dentro da v1: Login Google/Apple → Google Agenda → WhatsApp → Holyrics/API.

**Tarefas:**
- [ ] **T-11.30** — Login social **Google e Apple** + vínculo no perfil (`contas_vinculadas`).
- [ ] **T-11.31** — Integração **Google Agenda** (sincronizar escala do membro).
- [ ] **T-11.32** — **WhatsApp** (avisos/notificações) — vínculo no perfil + envio.
- [ ] **T-11.33** — **Holyrics** e **Tokens de API** por ministério (`integracoes_ministerio`, `api_tokens`).

---

### Módulo 12 — Vagas e Assinaturas (confirmado — D-11.2 = C híbrido)

**Entrega:** cada ministério tem **10 vagas grátis**; o dono compra
**pacotes de vagas** (ex.: +10) e **distribui entre ministérios**; tela "Minhas assinaturas"
mostra uso (x/y membros), histórico e "Corrigir compra".

**Banco (novo):**
```
assinaturas
  id            PK
  org_id        FK   NOT NULL
  responsavel_id FK -> membros.id
  plano         TEXT              -- '+10', '+20'...
  vagas_total   INTEGER NOT NULL  -- vagas extras compradas
  ciclo         TEXT              -- 'mensal' | 'anual'
  status        TEXT              -- 'ativa' | 'cancelada' | 'pendente'
  provider_ref  TEXT              -- id na loja/gateway (App Store/Play/Stripe)
  created_at    timestamptz

-- alocação das vagas extras por ministério já mora em ministerios.vagas_extras
-- (distribuição = repartir vagas_total da(s) assinatura(s) entre ministérios).
```
> **Impacto:** contagem de membros por ministério vs. `vagas_gratis + vagas_extras`
> bloqueia adicionar membro acima do limite. Billing por loja (IAP) ou gateway — decidir.

**Tarefas:**
- [ ] **T-11.34** — Migration `assinaturas` + regra de limite por ministério (`vagas_gratis + vagas_extras`).
- [ ] **T-11.35** — Fluxo de compra/distribuição de vagas + "Minhas assinaturas".
- [ ] **T-11.36** — Definir quais módulos ficam atrás de **PRO** (spec 03) no modelo híbrido.

---

## Impacto no que já existe (resumo)

- **Escalas/culto/repertório** ganham `ministerio_id` e a `funcao` (texto) vira FK `funcao_id`.
- **`repertorio`** é absorvido pelo **`roteiro_itens`** (setlist por culto).
- **`musicas`** ganha `artista`/`cifra_url`/`audio_url`; surge organização por `pastas`.
- **`membros`** ganha `data_nascimento`; papéis musicais podem migrar para `membro_funcoes`.
- **Sugestão de escala** passa a considerar **indisponibilidades**.
- **Spec 03 (PRO)** é afetada pela decisão de cobrança por vaga (D-11.2).
- **RBAC (spec 02)** ganha capacidades novas: `ministerio.gerenciar`, `aviso.publicar`,
  `integracao.gerenciar`, além de `ingresso.aprovar` (spec 01, D-01.5).

---

## Ordem sugerida de implementação

1. **Módulo 1 (Ministérios)** — estrutural; destrava ingresso por ministério e vagas.
2. **Módulos 2–3 (Confirmação + Roteiro)** — coração da escala; alto valor, baixo risco.
3. **Módulo 5 (Histórico)** e **Módulo 4 (Comentários)** — colaboração na escala.
4. **Módulos 7–8 (Indisponibilidades, Aniversariantes)** — dados de membro.
5. **Módulo 6 (Panorama)** — visão que depende de funções/escalas prontas.
6. **Módulo 10 (Repertório+)** e **Módulo 9 (Avisos)**.
7. **Módulo 11 (Integrações)** e **Módulo 12 (Vagas)** — dentro da v1: Login Google/Apple e
   Google Agenda primeiro; WhatsApp/Holyrics/API e billing de vagas depois.

---

## Dependências & riscos

- **Depende de:** 01 (multi-tenant/RLS), 02 (RBAC/capacidades), 08 (`musicas`/`videos`).
- **Decisões-chave: ✅ fechadas** — D-11.1 (ministério = entidade sob a org, N:N),
  D-11.2 (cobrança **híbrida**: vagas + PRO), integrações da v1 (Google, Apple, Google
  Agenda, WhatsApp, Holyrics, API). O módulo estrutural (ministérios) deve vir **primeiro**
  para evitar retrabalho de migration em várias tabelas.
- **Risco:** adicionar `ministerio_id` em tabelas com dados exige backfill cuidadoso (criar
  ministério "seed" por org, como foi feito com a org "seed" no multi-tenant).
- **Risco (segurança):** módulo 11 lida com tokens/segredos — nunca em claro; RLS não basta
  para segredo, cifrar em repouso e restringir acesso.
