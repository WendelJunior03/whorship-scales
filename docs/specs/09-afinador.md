# 09 — Afinador de Instrumentos

## Objetivo

Módulo de **afinador** que usa o **microfone do dispositivo** para detectar a nota tocada em
tempo real e indicar se está afinada. Instrumentos iniciais: Violão, Guitarra, Baixo,
Ukulele, Bateria (afinação por peça, quando aplicável).

Funcionalidades: detecção automática da nota, frequência em Hz, indicador visual (nota
atual × nota ideal, desafinado/afinado), interface simples.

---

## Contexto atual

- Nada relacionado a áudio/microfone existe hoje.
- É um módulo **client-side puro** — não precisa de backend (a menos que se guarde preferências).

---

## Decisões-chave

### D-09.1 — ⚠️ Alvo: PWA web vs. nativo (restrição técnica central)

Afinador depende de **captura de microfone** e **análise de áudio em tempo real**:
- **No navegador (PWA):** `navigator.mediaDevices.getUserMedia` + **Web Audio API**
  (`AnalyserNode`) — bem suportado. Requer **HTTPS** (produção na Vercel já é https).
- **No app nativo (Expo Go):** Web Audio API **não existe**; captura em tempo real de PCM do
  microfone exige módulos nativos (ex.: `expo-av` grava, mas análise de frequência em tempo
  real é limitada) — bem mais complexo.

| Opção | Prós | Contras |
|-------|------|---------|
| **A. Web-first (só PWA)** | Viável e direto com Web Audio; cobre o caso de uso principal | Não funciona no app nativo |
| **B. Web + nativo** | Cobre tudo | Complexidade alta no nativo; provável módulo nativo custom |

> **Recomendação:** **A (web-first)** na v1. Afinador é um caso clássico de Web Audio no
> navegador; forçar nativo agora não compensa.

**Decisão: ✅ Web-first** (getUserMedia + Web Audio). Nativo fica para fase posterior.

---

### D-09.2 — Biblioteca de detecção de pitch

A detecção de frequência fundamental (F0) tem algoritmos consagrados (autocorrelação, YIN,
McLeod/MPM). Não precisa reinventar.

| Opção | O que é | Prós | Contras |
|-------|---------|------|---------|
| **A. `pitchy`** | Lib JS de detecção de pitch (McLeod) sobre Web Audio | Leve; focada; fácil de plugar no `AnalyserNode` | Só web |
| **B. Implementar YIN/autocorrelação na mão** | Algoritmo próprio sobre Web Audio | Controle total; sem dependência | Mais trabalho; precisa acertar suavização/estabilidade |
| **C. `ml5.js` / modelo (CREPE etc.)** | Pitch via ML | Robusto com ruído | Pesado; overkill pra afinador |

> **Recomendação:** **A (`pitchy`)** ou **B** se quiser aprender o algoritmo. C é overkill.
> Fazer um **spike** curto comparando estabilidade da leitura antes de fechar.

**Decisão: ✅ `pitchy`** (McLeod pitch detection) sobre Web Audio, com um spike de estabilidade antes de investir na UI. Fallback: implementar YIN próprio se necessário.

---

### D-09.3 — Afinações e conversão nota↔frequência

- Definir tabela de **afinações padrão** por instrumento (ex.: violão EADGBE) e permitir
  alternativas (drop D, etc.) — parte pode ser PRO ("afinadores avançados" na spec).
- Conversão frequência→nota via referência **A4 = 440 Hz** (deixar configurável no futuro).
- Indicador de **cents** de desvio (quão longe da nota ideal) para o medidor visual.

**Decisão: ✅ v1 com afinações padrão de violão (EADGBE), guitarra, baixo e ukulele.** Afinações alternativas (drop D etc.) e 'afinador avançado' → PRO. Bateria fica para iteração posterior.

---

## Modelo de dados

Praticamente **nenhum** backend necessário na v1 (módulo client-side). Opcional/futuro:
```
-- (opcional) preferências do usuário
membro_preferencias
  membro_id   FK
  afinador_ref_hz   int default 440
  ...
```

Se nada for persistido, o módulo não toca o banco.

---

## Impacto no que já existe

- Frontend: nova tela/módulo "Afinador" (entrada no menu). Permissão de microfone.
- Componente de **medidor visual** (ponteiro/agulha ou barra) — entra no design system (spec 04).
- Sem impacto no backend (a menos que se persista preferência).
- Recursos "afinador avançado" declarados como chave PRO (spec 03), liberados na v1.

---

## Tarefas

- [x] **T-09.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-09.1 (alvo), D-09.2 (lib), D-09.3 (afinações/PRO).
- [ ] **T-09.2** — Spike: captar microfone (getUserMedia) + detectar pitch estável no PWA.
  _Pronto quando:_ tocar uma corda mostra a nota e os Hz de forma estável (sem "tremer").
- [ ] **T-09.3** — Conversão frequência→nota + cálculo de cents de desvio.
- [ ] **T-09.4** — UI do afinador: nota atual, nota ideal, Hz, indicador afinado/desafinado.
- [ ] **T-09.5** — Seleção de instrumento/afinação (violão, guitarra, baixo, ukulele; bateria à parte).
- [ ] **T-09.6** — Tratamento de permissão negada de microfone + fallback amigável.
- [ ] **T-09.7** — Declarar chaves de recurso PRO (afinações avançadas) sem bloquear.

---

## Dependências & riscos

- **Depende de:** 04 (componente visual no design system) e 03 (chave PRO). **Independe** de 01/02 (não usa dados de org).
- **Risco técnico:** estabilidade da leitura em ambiente com ruído. Mitigação: suavização
  (média móvel / thresholds) e o spike T-09.2 antes de investir na UI.
- **Restrição:** microfone exige **HTTPS** e permissão do usuário (ok em produção).
- **Bateria:** "afinação por peça" é caso especial (afinação de tambor por frequência é menos
  padronizada) — considerar deixar bateria pra uma iteração posterior.
