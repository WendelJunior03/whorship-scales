# 05 — Módulo Octapad

## Objetivo

Área exclusiva **Octapad**: uma interface tipo **pad eletrônico**, com pads configuráveis,
**reprodução instantânea de sons com latência mínima**, interface responsiva e organização
dos pads por categoria.

Possibilidades futuras: upload de samples, packs de sons, compartilhamento de presets,
volume individual por pad.

---

## Contexto atual

- Nada de áudio existe hoje.
- Este e o **Banco de Pads** (spec 06) compartilham a mesma **infra de áudio** — vale
  projetá-los juntos (uma engine de áudio reutilizável).

---

## Decisões-chave

### D-05.1 — ⚠️ Alvo: PWA web vs. nativo

Como no afinador, a reprodução de som de baixa latência é natural no navegador via **Web
Audio API** (que permite pré-carregar buffers e disparar sem lag). No nativo (Expo), o
caminho seria `expo-av` — com **latência tipicamente maior**, ruim pra um pad de percussão.

| Opção | Latência | Nota |
|-------|----------|------|
| **A. Web-first (Web Audio API)** | Baixa (ideal) | Cobre o PWA; recomendado |
| **B. Nativo (expo-av)** | Maior | Pode não atingir "latência mínima" pedida |

> **Recomendação:** **A (web-first)**. "Latência mínima" praticamente exige Web Audio API;
> no nativo, gerenciar isso é bem mais difícil. Confirmar que Octapad é feature de PWA.

**Decisão: ✅ Áudio web-first (Web Audio API), com a engine abstraída atrás de uma interface** para receber implementação nativa depois ('PWA-first agora, nativo depois'). No app nativo v1, o módulo degrada.

---

### D-05.2 — Engine de áudio: Web Audio puro vs. Tone.js vs. Howler.js

| Opção | O que é | Prós | Contras |
|-------|---------|------|---------|
| **A. Web Audio API puro** | Usar `AudioContext` + `AudioBufferSourceNode` direto | Latência mínima; controle total; zero dependência | Mais código de baixo nível (carregar/decodificar buffers, agendar) |
| **B. Howler.js** | Lib de áudio web focada em SFX/samples | API simples; sprites de áudio; fallbacks | Camada a mais; menos controle fino de timing |
| **C. Tone.js** | Framework de áudio musical (sintetizadores, timing musical) | Poderoso pra música/loops/timing | Pesado; feito pra síntese/sequenciamento, mais do que um pad de samples precisa |

> **Recomendação:** **A (Web Audio puro)** para o Octapad — samples curtos disparados por
> toque pedem exatamente `AudioBuffer` pré-decodificado + `start()` (latência mínima). **C
> (Tone.js)** faz mais sentido se o Banco de Pads (spec 06) precisar de loops sincronizados/
> tempo musical — avaliar em conjunto.

**Decisão: ✅ Web Audio API puro** (`AudioBuffer` pré-decodificado + `start()` para latência mínima). Sem Tone.js (não há necessidade de síntese/sync — ver D-06.2). Engine única, compartilhada com a spec 06.

---

### D-05.3 — Origem dos sons na v1

| Opção | Prós | Contras |
|-------|------|---------|
| **A. Sons embarcados no app** (conjunto fixo) | Simples; offline; sem storage | Sem personalização |
| **B. Sons servidos/baixados** (storage) | Base pra packs/upload futuros | Precisa de storage/CDN (ver spec 06) |

> **Recomendação:** **A** na v1 (um conjunto curado de samples embarcados), deixando upload/
> packs (B) como PRO/futuro — o que já conversa com a spec 06 (storage) e 03 (PRO).

**Decisão: ✅ v1 com sons embarcados** (conjunto curado). Upload/packs → PRO/futuro (usa o storage da spec 06).

---

## Modelo de dados (esboço)

Na v1 com sons embarcados, o backend é mínimo. Estrutura pra quando presets forem persistidos:
```
octapad_presets            -- (futuro) configuração de pads do usuário/igreja
  id          PK
  org_id      FK
  membro_id   FK null      -- preset pessoal ou da org
  nome        text
  config      jsonb        -- mapa pad->sample, volume, cor, categoria
  created_at
```
Samples embarcados não precisam de tabela. Upload de samples → ver spec 06 (storage) + PRO.

---

## Impacto no que já existe

- Frontend: novo módulo "Octapad" (grid de pads responsivo, categorias, feedback visual ao tocar).
- Nova **engine de áudio** reutilizável (compartilhada com spec 06) — decisão D-05.2.
- Sem impacto relevante no backend na v1 (sons embarcados).
- Chaves de recurso PRO declaradas (upload de samples, packs, presets compartilhados) — spec 03.

---

## Tarefas

- [x] **T-05.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-05.1 (alvo), D-05.2 (engine, junto com spec 06), D-05.3 (origem dos sons).
- [ ] **T-05.2** — Spike de latência: tocar um sample via Web Audio ao toque e medir resposta.
  _Pronto quando:_ o disparo é percebido como instantâneo (sem lag audível).
- [ ] **T-05.3** — Engine de áudio reutilizável (carregar/decodificar/pré-armazenar buffers; tocar; volume).
- [ ] **T-05.4** — Curar o conjunto inicial de samples + categorias.
- [ ] **T-05.5** — UI do grid de pads (responsivo, categorias, feedback visual/haptics no toque).
- [ ] **T-05.6** — Volume individual por pad (se entrar na v1) ou marcar como próxima iteração.
- [ ] **T-05.7** — Declarar chaves PRO (upload de samples, packs, compartilhar presets) sem bloquear.

---

## Dependências & riscos

- **Depende de:** 04 (UI/design system). **Compartilha engine** com 06. Independe de 01/02 na v1
  (a menos que presets sejam por organização).
- **Risco:** latência/glitches de áudio em dispositivos fracos. Mitigação: Web Audio + pré-decodificar buffers; spike T-05.2 antes da UI.
- **Risco:** iOS Safari exige **gesto do usuário** para iniciar o `AudioContext` (autoplay
  policy). Mitigação: iniciar o contexto no primeiro toque.
- **Decisão coordenada:** engine de áudio deve ser fechada **junto** com a spec 06 pra não ter duas implementações.
