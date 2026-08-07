# 06 — Banco de Pads Musicais

## Objetivo

Aba dedicada à organização de **pads por tonalidade** (C, C#, D, D#, E, F, F#, G, G#, A,
A#, B). Cada tonalidade pode conter: **Pads, Ambientes, Atmosferas, Loops, Introduções e
FX**.

Futuramente: Favoritos, Busca inteligente, Filtros, **Download offline (PRO)**.

> Compartilha a **engine de áudio** com o Octapad (spec 05) — decidir as duas juntas. A
> diferença: aqui os áudios tendem a ser **loops/ambientes longos** (streaming/playback com
> loop), não samples curtos de percussão.

---

## Contexto atual

- Nada de áudio/biblioteca de pads existe.
- Diferente do Octapad, este módulo praticamente exige **storage de arquivos de áudio**
  (loops longos não cabem embarcados no bundle).

---

## Decisões-chave

### D-06.1 — Onde hospedar os arquivos de áudio (storage)

Loops/ambientes são arquivos grandes → não dá pra embarcar no app. Precisa de storage + entrega (CDN).

| Opção | Prós | Contras |
|-------|------|---------|
| **A. Object storage + CDN** (ex.: Cloudflare R2, Backblaze B2, AWS S3) | Barato/escalável; CDN pra streaming; padrão de mercado | Config nova; credenciais; custo por uso |
| **B. Supabase Storage** | Storage + CDN + auth num pacote; free tier | Mais uma plataforma no stack (já tem Neon/Render/Vercel) |
| **C. Servir do próprio backend (Render)** | Zero serviço novo | Render free tier não é bom pra servir mídia; sem CDN; ruim pra offline/escala |

> **Recomendação:** **A (R2/B2)** — barato, com CDN, e o **egress do Cloudflare R2 é
> gratuito**, o que é ideal pra streaming de áudio. Evitar **C**. Vale confirmar preferência.

**Decisão: ✅ Cloudflare R2** (egress gratuito + CDN, ideal para streaming de áudio). Confirmar/criar a conta ao chegar na Fase C. Evitar servir mídia pelo backend (Render).

---

### D-06.2 — Reprodução: samples curtos (spec 05) vs. loops longos (aqui)

- Octapad = `AudioBuffer` curto pré-carregado, disparo instantâneo.
- Banco de pads = **loop/ambiente longo** → melhor usar **streaming** (`<audio>` /
  `MediaElementSource`) com **loop** e crossfade, em vez de carregar tudo em memória.
- Se houver necessidade de **sincronizar** loops por BPM/tempo, **Tone.js** passa a fazer
  sentido (ver D-05.2). Caso contrário, Web Audio puro basta.

**Decisão: ✅ Sem sincronização por BPM na v1** (loops tocam livres) → Web Audio puro basta, sem Tone.js. Sync musical fica como evolução futura.

---

### D-06.3 — Download offline (PRO) e PWA

"Download offline" é marcado como **PRO** e conecta com a meta "Offline First" da spec de
arquitetura. Isso depende de **Service Worker + Cache API / storage local** (o roadmap do
projeto lista "Service Worker" como pendência ainda não feita).

| Opção | Nota |
|-------|------|
| **A. Adiar offline pra depois** (streaming online na v1) | Recomendado — entrega o módulo sem depender do SW |
| **B. Implementar offline junto** | Puxa a spec de Service Worker inteira; mais escopo |

> **Recomendação:** **A** — v1 online-only; offline (PRO) vira uma frente própria depois,
> junto com o Service Worker geral do PWA.

**Decisão: ✅ Offline (PRO) adiado** — v1 online-only (streaming via CDN). Offline entra depois, junto com o Service Worker geral do PWA.

---

### D-06.4 — Conteúdo inicial (curadoria vs. upload)

- v1: um **catálogo curado** de pads por tonalidade (poucos por tom pra validar).
- Upload próprio e packs → **PRO**/futuro (declarar chave, não implementar agora).

**Decisão: ✅ Catálogo curado inicial** (poucos pads por tonalidade, populados via seed/admin). Upload próprio → PRO/futuro. Garantir licença de uso/distribuição dos áudios.

---

## Modelo de dados (esboço)

```
pads
  id           PK
  org_id       FK null      -- null = catálogo global; preenchido = pad da organização (upload futuro)
  tonalidade   text         -- 'C' | 'C#' | ... | 'B'
  tipo         text         -- 'pad' | 'ambiente' | 'atmosfera' | 'loop' | 'introducao' | 'fx'
  nome         text
  arquivo_url  text         -- URL no storage/CDN (D-06.1)
  duracao_seg  int null
  bpm          int null     -- se aplicável (loops)
  is_premium   bool default false   -- gating PRO (spec 03)
  created_at

pad_favoritos               -- (futuro) favoritos por membro
  membro_id  FK
  pad_id     FK
```

Índice: `(tonalidade, tipo)`, `(org_id)`. Catálogo global (`org_id null`) visível a todas as
orgs; uploads da org isolados por `org_id`.

---

## Impacto no que já existe

- Novo serviço de **storage** (D-06.1) — primeira mídia hospedada do projeto.
- Reaproveita a **engine de áudio** da spec 05 (estender pra loops/streaming).
- Frontend: aba "Banco de Pads" com navegação por tonalidade → tipo; player de loop com controles.
- Backend: módulo `pads` + integração de storage (URLs assinadas se o bucket for privado).
- Chaves PRO declaradas: `pads.download_offline`, `pads.upload`, `pads.pack_premium`.

---

## Tarefas

- [x] **T-06.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-06.1 (storage), D-06.2 (reprodução/Tone.js), D-06.3 (offline), D-06.4 (conteúdo).
- [ ] **T-06.2** — Provisionar storage + CDN e definir como as URLs chegam ao app (públicas vs. assinadas).
- [ ] **T-06.3** — Migration `pads` (+ favoritos futuro) com `tonalidade`, `tipo`, `is_premium`, `org_id`.
- [ ] **T-06.4** — Estender a engine de áudio (spec 05) para loops/streaming com loop e volume.
  _Pronto quando:_ um loop toca continuamente sem "clique" na emenda.
- [ ] **T-06.5** — UI: navegação por tonalidade → tipo (Pads/Ambientes/Atmosferas/Loops/Intros/FX).
- [ ] **T-06.6** — Player de pad (play/stop, volume, indicação de tom/BPM).
- [ ] **T-06.7** — Curar e subir o catálogo inicial de pads por tonalidade.
- [ ] **T-06.8** — Declarar chaves PRO (offline, upload, packs) sem bloquear.

---

## Dependências & riscos

- **Depende de:** 05 (engine de áudio — decidir junto), 04 (UI), 03 (PRO), 01 (org_id nos uploads).
- **Risco:** custo/latência de streaming de áudio. Mitigação: CDN (R2/B2), arquivos otimizados (bitrate adequado).
- **Risco:** emendas de loop audíveis. Mitigação: samples preparados pra loop + crossfade.
- **Direitos autorais:** garantir que os pads do catálogo tenham licença de uso/distribuição.
