# 10 — Metrônomo Inteligente com BPM Automático

## Objetivo

Módulo de **Metrônomo** integrado à biblioteca de músicas: cada música guarda seu **BPM**,
e o app oferece um metrônomo que pode ser usado **solto** (aba própria) ou **a partir de uma
música** (inicia já no BPM salvo). A meta é eliminar a busca manual de BPM e tornar o app uma
ferramenta completa de preparação para ensaios e ministrações.

Fluxo desejado ao cadastrar música (com link do YouTube):
1. **Opção 1 — Descoberta automática do BPM (preferencial):** o sistema tenta identificar o
   BPM; se achar, salva (editável) e exibe.
2. **Opção 2 — Ajuste manual:** se não achar, o admin informa/edita o BPM.

---

## Contexto atual

- Não há metrônomo nem BPM hoje. `repertorio` guarda `tom` e `link`, mas não BPM.
- A **entidade `musicas`** é criada na spec 08 (Biblioteca de Vídeos) — este módulo
  **adiciona a coluna `bpm`** a ela e reaproveita o link do YouTube já cadastrado lá.
- A **engine de áudio** (Web Audio API puro) foi decidida nas specs 05/06 — o metrônomo é
  mais um consumidor dela, mas com um requisito extra forte: **timing rítmico preciso**.
- Alvo da plataforma: **PWA-first agora, nativo depois** (decisão global) — vale para este módulo.

> ⚠️ Ponto sensível: **descobrir BPM automaticamente a partir de um link do YouTube é
> genuinamente difícil e nem sempre confiável.** O YouTube não expõe BPM; as saídas reais são
> consultar bases de BPM por título/artista (impreciso) ou analisar o áudio (pesado e com
> implicações de ToS). Ver D-10.1 — a recomendação é tratar o **manual como base garantida** e
> o **automático como "melhor esforço" com confirmação**.

---

## Decisões-chave

### D-10.1 — Estratégia de descoberta automática do BPM (a decisão central)

| Opção | Como funciona | Prós | Contras |
|-------|---------------|------|---------|
| **A. Manual como base + auto "best-effort" via API de BPM** | Salvar sempre manual; ao cadastrar, consultar uma **base de BPM por título/artista** (ex.: GetSongBPM) e **sugerir** o valor pra o admin confirmar | Confiável (admin valida); leve; sem processar áudio; sem problema de ToS | Auto depende de casar título↔faixa; pode não achar; BPM da base pode divergir da versão do vídeo |
| **B. Análise de áudio no servidor** | Extrair o áudio do vídeo (ex.: `yt-dlp`) e rodar detecção de batida (essentia.js / aubio / web-audio-beat-detector) | Não depende de base externa; funciona pra qualquer faixa | **Extrair áudio do YouTube fere o ToS**; infra pesada (CPU/tempo); Render free tier não aguenta; latência alta |
| **C. Análise de áudio no cliente** | Tocar um trecho e analisar no navegador | Sem servidor | Precisa de acesso ao áudio decodificado (o embed do YouTube **não** entrega PCM); inviável com IFrame |
| **D. Só manual na v1** | Sem automático; admin digita/usa "tap tempo" | Simplíssimo; 100% confiável | Não entrega a "descoberta automática" pedida |

> **Recomendação:** **A** — manual como fonte da verdade + descoberta automática como
> **sugestão** via API de BPM (com confirmação do admin) e um **"tap tempo"** (bater o ritmo na
> tela) como alternativa sempre disponível. **B** tem risco de ToS/infra desproporcional; **C**
> é inviável com o embed. Se A não achar, cai no manual/tap.

**Decisão: ✅ A — Manual como base + descoberta automática "best-effort".** O BPM salvo é
sempre editável; ao cadastrar, consultar uma **API de BPM por título/artista** (**GetSongBPM** —
grátis com atribuição; avaliar cobertura do repertório gospel/PT-BR) e **sugerir** o valor para o
admin confirmar. **"Tap tempo"** sempre disponível como alternativa. **Não** extrair áudio do
YouTube (ToS + infra). Se a API não achar, cai no manual/tap.

---

### D-10.2 — Engine de timing do metrônomo (precisão)

Metrônomo exige batidas **regulares e precisas**. `setInterval`/`setTimeout` sozinhos derivam
(jitter, throttling). O padrão consagrado no navegador é **agendar via Web Audio clock com
lookahead** ("A Tale of Two Clocks").

| Opção | Precisão | Nota |
|-------|----------|------|
| **A. Web Audio scheduling (lookahead)** | Alta | Padrão de mercado; usa `AudioContext.currentTime` + agenda notas à frente. **Recomendado** |
| **B. AudioWorklet** | Máxima | Mais robusto em background, porém mais complexo |
| **C. `setInterval` puro** | Baixa | Deriva/treme; só como fallback pobre |

> **Recomendação:** **A** (lookahead scheduler sobre a engine Web Audio já decidida na spec 05),
> com **B (AudioWorklet)** como evolução se o funcionamento em segundo plano exigir.

**Decisão: ✅ A — Web Audio scheduling com lookahead** ("A Tale of Two Clocks"), sobre a engine
da spec 05. AudioWorklet (B) fica como evolução se o segundo plano exigir.

---

### D-10.3 — Funcionamento em segundo plano (limitação real de PWA)

A spec pede tocar "em segundo plano quando permitido". No navegador isso é **limitado**: com a
aba em background, timers são estrangulados; o áudio via Web Audio **costuma continuar**, mas
não é garantido em todos os SO/navegadores, e a tela apagada no mobile pode suspender.

| Opção | Nota |
|-------|------|
| **A. Best-effort com Web Audio + Wake Lock** | Manter o `AudioContext` tocando + `Screen Wake Lock API` pra segurar a tela durante o uso. Pragmático. **Recomendado** |
| **B. AudioWorklet + estratégias anti-throttle** | Mais resiliente, mais complexo |
| **C. Prometer background total** | Não dá pra garantir no PWA; evitar prometer |

> **Recomendação:** **A** — best-effort, com Wake Lock durante o ensaio e comunicação clara de
> que background total depende do dispositivo. Não prometer o que o navegador não garante.

**Decisão: ✅ A — Best-effort + Screen Wake Lock.** Manter o `AudioContext` tocando + segurar a
tela durante o uso; comunicar que o funcionamento em background total depende do dispositivo.

---

### D-10.4 — BPM "de trabalho" vs. BPM salvo da música

Ao iniciar o metrônomo por uma música, o usuário pode **subir/descer o BPM em tempo real sem
alterar o valor salvo**, com opção de **restaurar o original**.

- Modelagem: o BPM salvo (`musicas.bpm`) é imutável na sessão; o metrônomo opera sobre um
  **BPM de trabalho** em memória (estado da tela), com botão "restaurar original".
- Só um **admin editando a música** altera o `musicas.bpm` persistido.

> **Recomendação:** BPM de trabalho é **estado efêmero de UI** (não persiste). Persistir
> ajustes por músico é funcionalidade futura ("perfis de metrônomo por músico").

**Decisão: ✅ BPM de trabalho é estado efêmero de UI** (não persiste na v1). Só o admin editando
a música altera `musicas.bpm`. Persistir ajuste por músico = funcionalidade futura ("perfis de metrônomo").

---

### D-10.5 — Sons do metrônomo

- Vários timbres: click, woodblock, beep, etc. → **samples curtos embarcados** (como no Octapad)
  ou **sintetizados** via oscilador (Web Audio) — sintetizar é leve e evita assets.
- Subdivisões (semínima, colcheias, tercinas, semicolcheias) e **acento no tempo 1**.

**Decisão: ✅ Timbres sintetizados via oscilador (Web Audio)** na v1 — leve, sem assets, com
**acento no tempo 1** e subdivisões. Samples embarcados (woodblock etc.) ficam como evolução.

---

## Modelo de dados (esboço)

```
-- Adição à entidade criada na spec 08:
musicas
  ...
  bpm            int null       -- BPM salvo da música (nullable até ser definido)
  bpm_origem     text null      -- 'auto' | 'manual' | 'tap'  (rastrear como foi obtido)
  duracao_seg    int null       -- opcional (exibição, ex.: 5:14)
```

O **metrônomo em si não precisa de tabela** na v1 (é client-side + o BPM vem de `musicas`).
Futuro (declarar como evolução, não implementar agora):
```
metronomo_presets        -- presets personalizados por músico (futuro)
setlists / setlist_itens -- setlist com troca automática de BPM (futuro)
```

---

## Impacto no que já existe

- **Spec 08:** adicionar `bpm` (e opcionalmente `bpm_origem`, `duracao_seg`) a `musicas`;
  a tela de cadastro/edição de música ganha o campo BPM + botão de descoberta automática + tap tempo.
- **Backend:** endpoint para disparar a descoberta de BPM (se D-10.1 = A/B) e salvar/editar BPM.
- **Frontend:** nova **aba "Metrônomo"** (uso solto) + botão **"▶ Iniciar Metrônomo"** na tela
  da música (inicia no BPM salvo). Reusa a engine de áudio (spec 05).
- **PRO (spec 03):** declarar chaves das features avançadas — ex.: `metronomo.midi_sync`,
  `metronomo.setlist`, `metronomo.presets` — liberadas na v1.
- **RBAC (spec 02):** editar o BPM salvo da música = capacidade de admin; usar o metrônomo = todos.

---

## Tarefas

- [x] **T-10.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-10.1 a D-10.5: BPM manual+tap
  como base + API GetSongBPM como sugestão; Web Audio lookahead; best-effort+Wake Lock; BPM de
  trabalho efêmero; timbres sintetizados.
- [ ] **T-10.2** — Migration: adicionar `bpm` (+ `bpm_origem`, `duracao_seg`) a `musicas`.
- [ ] **T-10.3** — Backend: salvar/editar BPM da música (admin). _Pronto quando:_ BPM aparece na tela da música.
- [ ] **T-10.4** — (Se D-10.1 = A) Integração com a API de BPM: consultar por título/artista e
  **sugerir** o valor. _Pronto quando:_ ao cadastrar, o sistema propõe um BPM que o admin confirma ou ignora.
- [ ] **T-10.5** — "Tap tempo" (bater o ritmo pra estimar BPM) como alternativa sempre disponível.
- [ ] **T-10.6** — Engine do metrônomo: scheduler com lookahead (Web Audio), subdivisões e
  acento no tempo 1. _Pronto quando:_ a batida é estável por vários minutos sem derivar.
- [ ] **T-10.7** — Aba "Metrônomo" (uso solto): start/stop grande, ajuste de BPM, volume, timbre, subdivisão.
- [ ] **T-10.8** — Integração com a música: botão "▶ Iniciar Metrônomo" no BPM salvo + BPM de
  trabalho em tempo real + "restaurar original".
- [ ] **T-10.9** — Segundo plano best-effort + Screen Wake Lock durante o uso.
- [ ] **T-10.10** — Declarar chaves PRO (MIDI, setlist, presets) sem bloquear.

---

## Funcionalidades futuras (arquitetura preparada, não implementar agora)

Contagem de entrada (2/4/8 tempos), perfis por músico, presets personalizados, **setlist com
troca automática de BPM**, vibração sincronizada, sinal visual pra ambientes silenciosos,
pedal Bluetooth, e **sincronização MIDI/software de áudio (PRO)**.

---

## Dependências & riscos

- **Depende de:** 08 (entidade `musicas` + link do YouTube), 05 (engine de áudio), 03 (chaves PRO),
  02 (admin edita BPM). Deve vir **depois** da spec 08.
- **Risco central (D-10.1):** BPM automático confiável a partir do YouTube é difícil. **Mitigação:**
  manual + tap tempo como base garantida; automático como sugestão validada pelo admin. **Não**
  depender de extrair áudio do YouTube (ToS + infra).
- **Risco:** background/lock de tela varia por dispositivo. **Mitigação:** best-effort + Wake Lock + comunicação honesta.
- **Precisão:** usar Web Audio scheduling (não `setInterval`) desde o início — ver D-10.2.
