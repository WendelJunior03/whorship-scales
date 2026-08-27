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

### D-06.5 — O que foi de fato construído: Pad Contínuo, não o catálogo por tonalidade

O que existe hoje em produção (`frontend/src/screens/padContinuo/`, `frontend/src/hooks/usePadContinuo.ts`,
commit `4edefbf`) é uma tela de **pad contínuo por nota**: 12 notas cromáticas, **uma
tocando por vez** (monofônico — trocar de nota desliga a anterior), com loop via
**crossfade agendado** (instâncias de `AudioBufferSourceNode` que se sobrepõem, sem
depender de `.loop` nativo — ver `padContinuoEngine.ts`) e fade de entrada/saída suave no
toggle do usuário. `AudioContext` compartilhado (`audio/audioContext.ts`) e a tela é só
consumidora de um hook controller (`usePadContinuo`) que centraliza o estado — os
componentes visuais nunca chamam a engine direto.

Isso é uma realização **mais simples e direta** do que a visão original desta spec (abas
por tonalidade × tipo — Pads/Ambientes/Atmosferas/Loops/Introduções/FX — com catálogo
`pads` no banco e storage em R2). O catálogo por tonalidade **não foi implementado** e não
tem tarefa em andamento.

**Decisão: ✅ Pad Contínuo (arquivo único por nota, sem catálogo/banco) é a base real
sobre a qual a arquitetura de camadas abaixo é construída.** O modelo de dados
`pads`/`pad_favoritos` desta spec (seção seguinte) permanece como visão futura — não é
pré-requisito do que vem a seguir.

---

### D-06.6 — Pad Contínuo evolui para multicamadas (diferencial do plano PRO)

O Pad Contínuo hoje é **1 pad = 1 nota ativa por vez**. A evolução: até **6 camadas**
tocando **simultaneamente**, cada uma com sua própria nota, volume, cutoff e mute/solo —
o FREE continua com a experiência atual (1 camada, a "Base 1"); o PRO desbloqueia as 6.

| Camada | Papel sonoro | Volume padrão sugerido |
|--------|--------------|------------------------|
| `base1` | Fundação — sempre disponível no FREE | 0.85 |
| `base2` | Fundação, reforço | 0.75 |
| `base3` | Fundação, reforço | 0.65 |
| `atmosfera` | Textura/ambiente | 0.45 |
| `reverse` | Textura (swell reverso) | 0.40 |
| `guitarra` | Melódico/textural | 0.50 |

> Valores acima são ponto de partida (bases mais altas que texturas, pra sair com mixagem
> equilibrada) — ajustar por ouvido durante a curadoria das gravações reais, não travar em
> código como verdade absoluta.

**Decisão: ✅ Multicamadas configuráveis (array de camadas, não hardcoded), FREE = 1
camada fixa (`base1`), PRO = todas.** Ver arquitetura completa e nova seção dedicada mais
abaixo ("Pad Contínuo — Arquitetura de Camadas").

> **Referência visual:** o layout de referência traz, por camada,
> on/off + mute + cutoff + fader de volume — isso entra. O bloco **Master** (volume +
> cutoff) também entra. **Fora do escopo, por decisão explícita:** um dial de nota
> global com auto-play/prev/next/play/stop e qualquer seletor de nota
> **global único** (ex.: um grid de 12 notas) — cada camada
> seleciona sua própria nota de forma independente (ver Grafo de áudio), então não existe
> "a nota atual do pad" como conceito único. O widget exato de seleção de nota por camada
> (chips, dropdown, stepper) fica em aberto pra implementação — fora do escopo desta spec
> de arquitetura.

---

### D-06.7 — Enforcement do gating FREE/PRO das camadas vs. `LIBERAR_TUDO_V1`

O catálogo de recursos (`backend/src/config/recursos.ts`) hoje tem `LIBERAR_TUDO_V1 = true`
— **todo** recurso PRO resolve como liberado, independente do plano da org, até a cobrança
entrar. Se a chave nova (`pads.camadas_extras`, sugestão) entrar nesse catálogo do jeito
normal, o gating de camadas também ficaria "sempre liberado" na v1 — ou seja, **o FREE
também veria as 6 camadas** até o dia em que `LIBERAR_TUDO_V1` virar `false`.

| Opção | Efeito | Nota |
|-------|--------|------|
| **A. Seguir o padrão existente** (chave normal em `recursos.ts`) | FREE também vê 6 camadas até a cobrança PRO existir de verdade | Consistente com **todo** o resto do catálogo hoje — nenhum recurso é bloqueado de verdade na v1 |
| **B. Caso especial** (essa chave ignora `LIBERAR_TUDO_V1`, bloqueia FREE já na v1) | FREE trava em 1 camada desde já | Inconsistente com o resto do produto; primeira exceção do tipo — quem mexer em `recursos.ts` no futuro precisa saber que essa chave é "diferente" |

> **Recomendação: A.** Mesmo raciocínio do resto do catálogo: a trava de plano é uma
> chave já pronta pra "virar" quando a cobrança PRO for real, sem lógica especial pra
> manter/lembrar. Também é reversível: nada impede religar `B` depois, se o dono do
> produto quiser essa camada travada **antes** da cobrança geral entrar (ex.: pra validar
> a demanda por PRO com essa feature específica).

**Decisão: ⬜ pendente — confirmar com o dono do produto se o gating de camadas segue o
padrão A (recomendado) ou precisa ser exceção (B) já na v1.**

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

## Pad Contínuo — Arquitetura de Camadas (PRO)

> Esta seção detalha D-06.6. É a evolução real que está sendo construída agora — enquanto
> o catálogo por tonalidade (seção anterior) segue como visão futura, não bloqueando nada
> aqui.

### Escala de conteúdo

**6 camadas** × **12 notas cromáticas** = **72 arquivos**, gravados pelo próprio time
(sem pitch-shift — cada nota de cada camada é um arquivo próprio, já preparado pra loop
sem transiente de ataque no início, mesmo cuidado já usado nas gravações atuais do Pad
Contínuo). Nomenclatura: `{camada}_{nota}.wav` — ex.: `base1_C.wav`, `atmosfera_C#.wav`.

> ⚠️ Mesma pegadinha de hoje com `#` em URL (ver `padContinuoEngine.ts`,
> `ARQUIVO_DA_NOTA`): usar o mesmo mapeamento nota→sufixo de arquivo sem `#` (ex.:
> `Csharp`) pros nomes de arquivo reais, independente de como a nota é rotulada na UI.

### Grafo de áudio

Cada camada é uma cadeia independente; todas somam num barramento master único:

```
Camada 1 (ex.: base1)
  AudioBufferSourceNode (buffer da nota ativa dessa camada — cacheado)
    → BiquadFilterNode (type: 'lowpass' — cutoff da camada)
      → GainNode (volume da camada — mute/solo atuam aqui, ver abaixo)
        ↘
Camada 2 (ex.: atmosfera)                                    masterGainNode (volume geral)
  AudioBufferSourceNode → BiquadFilterNode → GainNode          → DynamicsCompressorNode (limiter)
        ↘                                                          → destination
Camada N ...                                                        (AudioContext compartilhado,
        ↗                                                             audio/audioContext.ts)
```

- **Por camada:** volume e cutoff são nós próprios (`GainNode`/`BiquadFilterNode`) — ajustar
  um não afeta as outras camadas. O crossfade "infinito" (instâncias de
  `AudioBufferSourceNode` sobrepostas, sem `.loop` nativo — a técnica já usada em
  `iniciarLoopComCrossfade`) roda **por camada**, cada uma com seu próprio agendador.
- **Monofonia por camada, não mais global:** hoje, trocar de nota desliga a nota anterior
  **em todo o pad** (só existe uma nota tocando). Com camadas, cada camada tem sua própria
  nota ativa — trocar a nota da camada `atmosfera` não afeta a nota tocando em `base1`. É
  a mudança de comportamento mais importante a ter clara ao portar o código existente
  (ver revisão de decisões, abaixo).
- **Master bus:** soma de todas as camadas → `masterGainNode` (volume geral, controle já
  existente hoje) → `DynamicsCompressorNode` **sempre ativo** como limiter de segurança
  (evita clipping quando várias camadas tocam juntas no volume máximo) → `destination`.
  Parâmetros de limiter são fixos em código (não expostos como controle de usuário):
  `threshold` baixo (~ -6 dB), `ratio` alto (~ 12–20), `attack` rápido (~ 0.003s),
  `release` curto (~ 0.1s) — ajustar por ouvido na implementação, não é um número exato
  requerido por esta spec.

### Mute / Solo

- **Mute** de uma camada zera o ganho efetivo **dela**, sem afetar as demais.
- **Solo** é global entre camadas: se **qualquer** camada está em solo, todas as **não
  soloadas** ficam mudas (independente do próprio mute), e as soloadas tocam no volume
  configurado. Sem nenhuma camada em solo, vale o mute normal de cada uma.
- Consequência prática: o "ganho efetivo" de uma camada precisa ser recalculado sempre
  que **qualquer** camada muda mute/solo/volume — não só a própria. Centralizar esse
  cálculo num único lugar (ver `masterBus.ts` / `index.ts` na estrutura sugerida abaixo),
  não replicar a lógica em cada camada.

### Estratégia de carregamento (lazy loading)

Preserva o padrão já usado hoje (`padContinuoEngine.ts`, função `tocar`): **nada é
buscado até o primeiro uso**, e o resultado fica em cache pro resto da sessão.

**Quando o fetch dispara:**
1. Ligar uma camada (toggle on/off) **não** busca nada sozinho — só marca a camada como
   ativa/disponível pra tocar.
2. Só quando o usuário **seleciona/ativa uma nota específica dentro daquela camada** é que
   dispara `fetch('/pads/{camada}_{nota}.wav')` → `decodeAudioData` — e só se esse par
   (camada, nota) ainda não estiver em cache.
3. Trocar de nota **na mesma camada** reusa o buffer já cacheado se essa nota já tocou
   antes ali; a mesma nota **em outra camada** precisa buscar o arquivo dela (arquivos são
   por-camada, nunca compartilhados entre camadas).
4. Nunca pré-carregar as 6 camadas × 12 notas de uma vez — nem ao montar a tela, nem ao
   ligar uma camada. Só o que o usuário efetivamente tocou.

**Cache:** em memória (mapa module-level chaveado por `${camada}_${nota}`, mesmo espírito
do objeto `tons` de hoje) — não persiste entre recarregamentos de página. Persistência
entre sessões (Cache API/IndexedDB) fica de fora, mesmo raciocínio de D-06.3 (offline
adiado).

**Estado de carregamento na UI:** o hook expõe um conjunto de chaves `${camada}_${nota}`
"em voo" (carregando agora). A tela usa isso pra:
- Mostrar um indicador (spinner, opacidade reduzida) **só no controle daquela nota
  específica** — as outras notas da mesma camada e as outras camadas continuam
  respondendo normalmente (fetches são independentes/paralelos entre camadas).
- Volume e cutoff da camada podem ser ajustados **mesmo antes** do áudio terminar de
  carregar — esses nós (`GainNode`/`BiquadFilterNode`) existem independente do buffer
  chegar; só a fonte (`AudioBufferSourceNode`) espera o buffer.
- Ao terminar o `decodeAudioData`, sai do conjunto "em voo", entra no cache, e o loop com
  crossfade começa a tocar normalmente.

### Estrutura de módulos sugerida (`src/audio/`)

O engine sai do escopo da tela (`screens/padContinuo/padContinuoEngine.ts`) e vira parte
de `src/audio/`, ao lado do que o Octapad já usa — mesmo espírito de "motor reutilizável"
que `motor.ts` já declara em comentário, sem forçar a mesma abstração (`MotorAudio`) do
Octapad, que resolve um problema diferente (samples curtos, futuro suporte nativo):

```
src/audio/
  audioContext.ts            # existente, sem mudança — AudioContext compartilhado
  padContinuo/
    tipos.ts                 # Nota, CamadaId, EstadoCamada (nota ativa, volume, cutoff, mute, solo)
    catalogo.ts               # definição estática das 6 camadas: id, rótulo, prefixo de
                               # arquivo, volume padrão (tabela de D-06.6), disponível-no-FREE
    carregador.ts             # fetch + decodeAudioData + cache por (camada, nota);
                               # expõe o conjunto "em voo" pro estado de loading da UI
    camadaEngine.ts            # grafo de UMA camada (source → biquad → gain) + o loop
                               # com crossfade "infinito", generalizado a partir da lógica
                               # já existente em padContinuoEngine.ts
    masterBus.ts               # masterGainNode → compressor → destination; cálculo do
                               # ganho efetivo por camada (mute/solo global, ver acima)
    index.ts                   # API pública: tocar(camada, nota), pararCamada(camada),
                               # definirVolume(camada, v), definirCutoff(camada, hz),
                               # alternarMute(camada), alternarSolo(camada), volumeMaster(v)
```

`frontend/src/hooks/usePadContinuo.ts` evolui pra orquestrar N camadas (estado por
camada, não mais uma nota global) — continua sendo o **único mediador** entre a tela e o
motor (padrão já estabelecido: componentes visuais nunca chamam `padContinuo/index.ts`
direto). `PadContinuoScreen.tsx` continua no mesmo lugar, só passa a renderizar uma faixa
por camada em vez de um grid único de notas.

### RBAC — FREE vs. PRO

- Sugestão de chave no catálogo (`backend/src/config/recursos.ts`):
  `pads.camadas_extras` (`planoMinimo: 'pro'`).
- FREE: só a camada `base1` aparece/funciona (as outras 5 ficam ocultas ou bloqueadas com
  selo PRO — mesmo padrão visual já usado em `PerfilScreen.tsx`/`useRecurso`).
- PRO: as 6 camadas liberadas.
- Ver D-06.7 sobre a interação com `LIBERAR_TUDO_V1` — **decisão pendente** de o dono do
  produto confirmar antes de implementar o gating de verdade.
- Igual ao resto do catálogo hoje: esse gating é **só de UX no frontend** (esconder/mostrar,
  selo PRO). Não há endpoint de API pra "bloquear" — os arquivos de áudio são estáticos,
  sem autenticação por arquivo. Se isso virar um problema real (alguém habilitar via
  devtools), é o mesmo risco que já existe pra qualquer outro recurso PRO do catálogo
  atual — não é uma lacuna nova introduzida aqui.

### Revisão das decisões existentes desta spec

| Decisão | Precisa mudar? | Nota |
|---------|-----------------|------|
| D-06.1 (storage R2) | **Fica mais urgente, não muda de escolha** | 72 arquivos (mesmo comprimidos) são pesados demais pra continuar como asset estático do bundle/host atual (hoje: 12 arquivos MP3, ~3MB total, servidos de `/pads/`). Vale migrar pra R2 quando as gravações reais das 6 camadas estiverem prontas — não precisa ser antes de construir/testar a engine com poucos arquivos locais. |
| D-06.2 (Web Audio puro, sem Tone.js) | **Sem mudança** | Mais nós no grafo (`BiquadFilterNode`, `DynamicsCompressorNode`) continua sendo Web Audio puro. Nenhuma necessidade de sincronização por BPM aqui. |
| D-06.3 (offline adiado) | **Sem mudança** | Cache em memória (não persistente) já é consistente com "online-only" — nada de Service Worker precisa entrar agora. |
| D-06.4 (catálogo curado, cuidado com licença) | **Simplifica** | Os áudios são gravados pelo próprio time (sem pitch-shift) — a preocupação original de licenciamento de terceiros não se aplica aqui. Continua "curado" (não é upload de usuário final). |
| *(padrão de código, não decisão formal)* AudioContext compartilhado | **Sem mudança, é a base** | `getAudioContext()` de `audio/audioContext.ts` continua sendo a única instância, reusada por Pad Contínuo e Octapad. |
| *(padrão de código)* Controller-mediated UI (hook como único mediador) | **Sem mudança, só cresce** | `usePadContinuo` passa a orquestrar N camadas em vez de 1 nota, mas o princípio (tela nunca fala direto com a engine) continua igual. |
| *(padrão de código)* Loop "infinito" via crossfade agendado | **Sem mudança, se generaliza** | Mesma técnica de `iniciarLoopComCrossfade`, agora uma instância do agendador por camada, independentes entre si. |
| *(comportamento, não decisão escrita)* Monofonia (uma nota por vez) | **Muda de escopo: global → por camada** | Hoje é "uma nota entre as 12, no pad inteiro". Com camadas, cada camada é monofônica **dentro de si mesma** — camadas diferentes podem ter notas diferentes tocando ao mesmo tempo. Maior mudança de comportamento desta evolução; deixar explícito pra quem for portar o código existente. |

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

### Pad Contínuo — Arquitetura de Camadas (D-06.6/D-06.7)

- [ ] **T-06.9** — Confirmar com o dono do produto a pendência de D-06.7 (gating de
      camadas segue `LIBERAR_TUDO_V1` ou é exceção já na v1).
- [ ] **T-06.10** — Migrar `padContinuoEngine.ts` de `screens/padContinuo/` para
      `src/audio/padContinuo/` (`tipos.ts`, `catalogo.ts`, `carregador.ts`,
      `camadaEngine.ts`, `masterBus.ts`, `index.ts` — ver estrutura sugerida acima).
      _Pronto quando:_ o comportamento de hoje (1 camada, crossfade sem clique) continua
      idêntico depois da migração, só reorganizado.
- [ ] **T-06.11** — Generalizar o grafo por camada: `BiquadFilterNode` (cutoff) +
      `GainNode` (volume) por camada, `masterGainNode` + `DynamicsCompressorNode` no bus
      master. _Pronto quando:_ tocar as 6 camadas juntas no volume máximo não estoura
      (clipa) na saída.
- [ ] **T-06.12** — Mute/solo por camada, com solo global (ver regra acima).
- [ ] **T-06.13** — Monofonia por camada (nota independente por camada, não mais global)
      — atualizar `usePadContinuo` e a tela.
- [ ] **T-06.14** — Lazy loading por (camada, nota) com cache em memória + estado
      "carregando" exposto pro hook/UI (ver estratégia de carregamento acima).
- [ ] **T-06.15** — UI: uma faixa por camada (on/off, mute, solo, cutoff, volume, seletor
      de nota da camada) + seção Master (volume + indicação visual de limiter ativo).
      FREE mostra só `base1`; PRO mostra as 6 (gate via `pads.camadas_extras`).
- [ ] **T-06.16** — Gravar/preparar os 72 arquivos (`{camada}_{nota}.wav`, sem transiente
      de ataque) e decidir onde ficam hospedados nesta fase (local vs. já em R2 — ver
      D-06.1 revisitada).

---

## Dependências & riscos

- **Depende de:** 05 (engine de áudio — decidir junto), 04 (UI), 03 (PRO), 01 (org_id nos uploads).
- **Risco:** custo/latência de streaming de áudio. Mitigação: CDN (R2/B2), arquivos otimizados (bitrate adequado).
- **Risco:** emendas de loop audíveis. Mitigação: samples preparados pra loop + crossfade.
- **Direitos autorais:** garantir que os pads do catálogo tenham licença de uso/distribuição.

**Arquitetura de Camadas (D-06.6):**
- **Depende de:** as 72 gravações (`{camada}_{nota}.wav`) estarem prontas e preparadas
  pra loop (sem transiente de ataque) antes de validar a mixagem/limiter por ouvido.
- **Depende de:** decisão de produto pendente em D-06.7 (gating real vs. `LIBERAR_TUDO_V1`)
  antes de fechar T-06.9/T-06.15.
- **Risco:** clipping ao somar até 6 camadas no master — mitigado pelo
  `DynamicsCompressorNode` como limiter (T-06.11), mas vale testar com as 6 camadas reais
  no volume máximo antes de considerar pronto.
- **Risco:** 72 arquivos estáticos locais (mesmo com lazy loading) pesam no host atual —
  reforça a urgência de D-06.1 (R2) assim que as gravações reais chegarem.
