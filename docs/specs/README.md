# 🚀 Deep Scales — Roadmap de Evolução (Specs)

Este diretório contém as **especificações de evolução** do Deep Scales, transformando o
PWA atual (gestão de escalas de uma igreja) em uma **plataforma multi-igreja** com
ferramentas para músicos, líderes e administradores.

> ⚠️ **Estas specs ainda NÃO contêm código.** Cada documento traz objetivo, decisões
> técnicas em aberto (com opções comparadas), esboço de modelo de dados, impacto no que
> já existe, e uma lista de tarefas com "definição de pronto". As decisões marcadas com
> **`Decisão: ⬜ pendente`** precisam ser batidas por você antes da implementação.

---

## 🧭 Como ler

Cada spec segue a mesma estrutura:

1. **Objetivo** — o que a frente entrega e por quê.
2. **Contexto atual** — o que já existe no código e se relaciona.
3. **Decisões-chave** — alternativas comparadas (prós/contras) + espaço pra decisão.
4. **Modelo de dados** — esboço das tabelas/colunas novas.
5. **Impacto no que já existe** — o que muda no backend/frontend atuais.
6. **Tarefas** — passo a passo com "definição de pronto".
7. **Dependências & riscos**.

---

## 🗺️ Ordem de execução (Fundação primeiro)

A sequência foi pensada pra **evitar retrabalho**: a base multi-tenant e de permissões
precisa existir antes dos módulos, senão todo módulo teria que ser reescrito quando o
isolamento por igreja e o plano PRO entrarem.

> 📋 Plano de execução detalhado da Fase A: [`FASE-A-plano-implementacao.md`](./FASE-A-plano-implementacao.md)
> 👥 Divisão de tarefas entre 2 pessoas (sem conflito): [`FASE-A-divisao-tarefas.md`](./FASE-A-divisao-tarefas.md)

### Fase A — Fundação (base de tudo)
| # | Spec | Por que primeiro |
|---|------|------------------|
| 00 | [Arquitetura geral](./00-arquitetura-geral.md) | Define camadas, modularização e padrões que todas as outras specs seguem |
| 01 | [Multi-Tenant (Organizações)](./01-multi-tenant.md) | Todo dado passa a pertencer a uma igreja; muda schema e todas as queries |
| 02 | [RBAC (Permissões)](./02-rbac.md) | Amplia os papéis atuais; base do módulo de liderança e do plano PRO |
| 03 | [Plano PRO & Feature Flags](./03-plano-pro-feature-flags.md) | Todo módulo novo nasce atrás de uma flag Free/PRO |

### Fase B — Experiência
| # | Spec | Observação |
|---|------|-----------|
| 04 | [Redesign UI/UX](./04-redesign-ui-ux.md) | Feito depois da fundação pra não redesenhar telas duas vezes (navegação muda com multi-tenant/RBAC) |

### Fase C — Módulos de valor (independentes entre si)
| # | Spec | Complexidade |
|---|------|-------------|
| 08 | [Biblioteca de Vídeos (YouTube)](./08-biblioteca-videos.md) | Baixa — bom primeiro módulo pós-fundação |
| 09 | [Afinador de Instrumentos](./09-afinador.md) | Média — áudio via microfone (Web Audio) |
| 05 | [Octapad](./05-octapad.md) | Média/Alta — latência de áudio |
| 06 | [Banco de Pads Musicais](./06-banco-pads.md) | Média — reaproveita infra de áudio do Octapad + storage |
| 10 | [Metrônomo Inteligente (BPM)](./10-metronomo.md) | Média — timing preciso (Web Audio) + BPM por música; **depende da spec 08** |

### Fase D — Comunicação (mais pesada)
| # | Spec | Observação |
|---|------|-----------|
| 07 | [Reuniões da Liderança (Vídeo)](./07-reunioes-lideranca.md) | Requer infra de servidor de mídia; deixada por último por custo/complexidade |

---

## 📌 Log de decisões (Fase A/B/C/D)

Consolidação das decisões que travam a implementação (detalhe em cada spec):

| Spec | Decisão | Status |
|------|---------|--------|
| 01 | Estratégia de isolamento multi-tenant no Postgres | ✅ `org_id` por tabela; JWT; 1 org/usuário; código `PREFIXO-XXXXXX` |
| 02 | Modelo de permissões (enum ampliado vs. RBAC granular) | ✅ Dois eixos (papel_ministerio + papel_org); checagem por capacidade |
| 03 | Feature flags: caseiro vs. biblioteca | ✅ Caseiro (catálogo de recursos + resolvedor por plano) |
| 04 | Escopo do redesign: incremental vs. reescrita do design system | ✅ Design system primeiro; Moti/Reanimated; sidebar responsiva |
| 05 | Engine de áudio (Web Audio puro vs. Tone.js vs. Howler.js) | ✅ Web Audio API puro; engine abstraída |
| 05 | Alvo das features de áudio: só PWA web ou também nativo | ✅ Web-first (PWA-first agora, nativo depois) |
| 06 | Onde hospedar os samples de áudio (storage) | ✅ Cloudflare R2 (CDN); online-only na v1 |
| 07 | Solução de vídeo (LiveKit vs. Jitsi vs. mediasoup vs. ...) | ✅ Jitsi atrás de camada abstrata ProvedorDeReuniao |
| 09 | Biblioteca de detecção de pitch | ✅ pitchy (McLeod) |
| 10 | Estratégia de descoberta automática de BPM | ✅ Manual + tap tempo (base); API GetSongBPM como sugestão; sem extrair áudio do YouTube |
| 10 | Engine de timing do metrônomo + segundo plano | ✅ Web Audio lookahead; best-effort + Screen Wake Lock |

---

## ⚠️ Restrição transversal importante: PWA sobre Expo

O front é **React Native + Expo exportado pra web**. Vários módulos novos (Octapad, Banco
de Pads, Afinador) dependem de **Web Audio API / `getUserMedia`**, que existem no
navegador (PWA) mas **não** têm equivalente idêntico no runtime nativo (Expo Go / app
nativo). Antes de fechar essas specs, é preciso decidir se esses módulos serão
**web-only** (só no PWA) ou se precisam funcionar também no app nativo (o que exige libs
nativas de áudio, ex. `expo-av` / módulos nativos). Ver detalhe em cada spec. Recomendação
geral: **tratar áudio como web-first** e degradar graciosamente no nativo na v1.
