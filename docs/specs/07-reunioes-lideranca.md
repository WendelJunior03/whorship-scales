# 07 — Módulo de Reuniões da Liderança

## Objetivo

Área exclusiva para comunicação da **liderança da igreja**, incluindo **videoconferência**.
Papéis envolvidos (eixo organizacional — spec 02):

- **Membro:** só funcionalidades comuns (não participa das reuniões).
- **Líder:** participa das reuniões, recebe convites, visualiza materiais.
- **Administrador:** gerencia líderes, agenda reuniões, envia convites, administra conteúdos.

Área de administração (só admin): convidar líderes, promover membros → líderes, remover
líderes, gerenciar permissões.

A arquitetura deve ser preparada para, no futuro, reuniões **entre múltiplas igrejas**.

> É o módulo **mais pesado** do roadmap (infra de servidor de mídia) — por isso fica na
> **Fase D**, por último.

---

## Contexto atual

- Não há nada de reuniões nem de vídeo.
- Depende diretamente do **RBAC** (spec 02): os papéis Líder/Admin vêm de lá.
- Depende do **multi-tenant** (spec 01): reuniões são por organização (e futuramente inter-org).

---

## Decisões-chave

### D-07.1 — Solução de videoconferência (a decisão pesada)

A spec pede avaliar soluções **open source**: Jitsi Meet, LiveKit, BigBlueButton, mediasoup,
OpenVidu. Resumo comparativo:

| Solução | Modelo | Prós | Contras | Encaixe aqui |
|---------|--------|------|---------|--------------|
| **Jitsi Meet** | App/plataforma SFU pronta | Mais rápido de subir; app completo; embed via `iframe`/SDK; grátis | Menos controle fino; customização de UI limitada no modo embed; escalar self-host dá trabalho | **Ótimo pra MVP rápido** |
| **LiveKit** | SFU + **SDKs** (WebRTC) open source; cloud opcional | SDKs excelentes (web/React Native); escalável; controle de UI total; opção **LiveKit Cloud** (sem manter servidor) | Você monta a UI e a sinalização/tokens; mais dev que Jitsi | **Melhor pra produto próprio/integrado** |
| **mediasoup** | **Biblioteca** SFU (baixo nível) | Máximo controle e performance | Você constrói praticamente tudo (sinalização, UI, escala); alto esforço | Over-engineering agora |
| **BigBlueButton** | Plataforma de sala de aula virtual | Rico (quadro, apresentação) | Pesado de hospedar; focado em ensino; difícil de embutir | Provável exagero |
| **OpenVidu** | Camada sobre mediasoup/Kurento | Facilita mediasoup; tem tiers | Menos tração que LiveKit; ainda exige infra | Alternativa média |

**Eixo extra — hospedar vs. gerenciado:**
- **Self-host** (Jitsi/LiveKit/mediasoup): controle e custo de servidor; complexidade de ops (TURN/STUN, escala).
- **Gerenciado** (LiveKit Cloud, Jitsi as-a-service/JaaS): sem manter mídia; custo por uso; entrega mais rápida.

> **Recomendação:**
> - **MVP mais rápido:** **Jitsi** (self-host ou JaaS) embutido — sala em minutos.
> - **Produto integrado/escalável (multi-igreja futuro):** **LiveKit** com **LiveKit Cloud**
>   no começo (sem manter servidor), migrando pra self-host se o custo justificar. LiveKit
>   tem os melhores SDKs pra web **e React Native**, o que casa com o stack Expo.
> - Evitar mediasoup/BBB agora (esforço desproporcional).
>
> Sugestão prática: **começar em Jitsi** pra validar o produto e **projetar a camada de
> reunião desacoplada** (interface `ProvedorDeReuniao`) pra poder trocar por LiveKit depois
> sem reescrever o módulo.

**Decisão: ✅ Jitsi**, atrás de uma camada abstrata `ProvedorDeReuniao` para poder trocar por LiveKit no futuro sem reescrever o módulo. Hospedagem: começar com Jitsi gerenciado (JaaS / 8x8) ou instância pública para o MVP; reavaliar self-host por custo depois.

---

### D-07.2 — Materiais e conteúdos da reunião

"Visualiza materiais" / "administra conteúdos": definir o que são (arquivos? pauta? atas?).
- v1 sugerida: **pauta + anexos (links/arquivos)** por reunião. Upload de arquivo reusa o
  storage da spec 06 (se já existir) ou fica como links na v1.

**Decisão: ✅ Materiais v1 = pauta (texto) + anexos por link** por reunião. Upload de arquivo reusa o storage da spec 06 quando existir.

---

### D-07.3 — Chat e gravação

Critérios da spec incluem chat e (implicitamente) qualidade. Gravação não é citada, mas é comum.
- **Chat:** Jitsi já traz; LiveKit tem data channels (você monta a UI).
- **Gravação:** custo/armazenamento relevante → provavelmente **PRO**/futuro.

**Decisão: ✅ Chat: usar o nativo do Jitsi na v1. Gravação: PRO/futuro** (custo de armazenamento).

---

### D-07.4 — Preparação para múltiplas igrejas (multi-org)

A spec pede arquitetura pronta pra reuniões **entre igrejas**. Na v1 as reuniões são **intra-
org** (só a liderança daquela igreja). Para não travar o futuro:
- Modelar `reuniao` com `org_id` **e** uma tabela de participantes que **não assuma** uma só org.
- Convites por identidade de usuário (não só "todos os líderes da org X").

**Decisão: ✅ v1 intra-organização, com modelagem multi-org-ready** (participantes por identidade de usuário, não 'todos os líderes da org X').

---

## Modelo de dados (esboço)

```
reunioes
  id            PK
  org_id        FK              -- organização anfitriã
  titulo        text
  descricao     text null       -- pauta
  inicio        timestamptz
  fim           timestamptz null
  sala_ref      text            -- id/URL da sala no provedor de vídeo (Jitsi/LiveKit)
  criada_por    FK -> membros.id
  status        text            -- 'agendada' | 'em_andamento' | 'encerrada'
  created_at

reuniao_participantes
  id            PK
  reuniao_id    FK
  membro_id     FK              -- (multi-org: membro pode ser de outra org no futuro)
  papel         text            -- 'anfitriao' | 'participante'
  convite_status text           -- 'convidado' | 'aceito' | 'recusado'

reuniao_materiais            -- (opcional v1)
  id            PK
  reuniao_id    FK
  tipo          text            -- 'link' | 'arquivo'
  url           text
  titulo        text

lideranca_convites           -- convidar/promover líderes (área de admin)
  id            PK
  org_id        FK
  membro_id     FK null         -- se já é membro da org
  email         text null       -- se for convite externo
  status        text            -- 'pendente' | 'aceito' | 'expirado'
  criado_por    FK -> membros.id
```

Papéis Líder/Admin vêm do **RBAC (spec 02)**; a promoção membro→líder é uma ação
protegida por capacidade (`lideranca.promover`).

---

## Impacto no que já existe

- Depende de RBAC (spec 02) para Líder/Admin e das capacidades de gestão.
- Novo módulo backend `reunioes` + `lideranca` (convites/promoções) + integração com o
  provedor de vídeo (geração de token/sala).
- Frontend: agenda de reuniões, tela de sala (embed/SDK de vídeo), área de admin de liderança
  (promover/remover/convidar), notificações de convite (reusa o sistema de notificações atual + e-mail Resend).
- Notificações: convite de reunião dispara notificação in-app + e-mail (infra já existe).

---

## Tarefas

- [x] **T-07.2** — ✅ Decidido (ver seção Decisões-chave). Fechar D-07.1 a D-07.4.
- [ ] **T-07.1** — _(opcional / de-priorizado — Jitsi já escolhido)_ POC pontual do Jitsi
  (entrar numa sala, áudio/vídeo, compartilhar tela, mobile/PWA) só para validar integração.
  _Pronto quando:_ uma sala Jitsi embutida funciona no PWA.
- [ ] **T-07.3** — Camada `ProvedorDeReuniao` desacoplada (interface) pra permitir trocar Jitsi↔LiveKit.
- [ ] **T-07.4** — Migrations: `reunioes`, `reuniao_participantes`, `lideranca_convites` (+ materiais opcional).
- [ ] **T-07.5** — Backend: agendar reunião, gerar sala/token no provedor, convidar participantes.
- [ ] **T-07.6** — Backend: área de admin de liderança (promover/remover líder, convidar) — protegida por capacidade (spec 02).
- [ ] **T-07.7** — Frontend: agenda de reuniões + tela da sala de vídeo (embed/SDK).
- [ ] **T-07.8** — Frontend: área de admin de liderança + fluxo de convite/aceite.
- [ ] **T-07.9** — Notificações de convite (in-app + e-mail via Resend).
- [ ] **T-07.10** — Validar isolamento por organização (líder da org A não entra em reunião da org B).

---

## Dependências & riscos

- **Depende de:** 02 (RBAC — Líder/Admin) e 01 (multi-tenant). **Bloqueado** até a fundação existir.
- **Risco alto — custo/ops de mídia:** WebRTC precisa de TURN/STUN; self-host escala mal sem
  investimento. Mitigação: começar **gerenciado** (LiveKit Cloud/JaaS) e reavaliar por custo.
- **Risco — mobile/nativo:** vídeo no Expo. LiveKit tem SDK RN; Jitsi tem SDK nativo/`iframe`
  no web. Confirmar alvo (PWA vs. nativo — spec 04) muda a escolha.
- **Risco — escopo:** é o maior módulo. Mitigação: MVP intra-org com uma sala simples antes de
  chat/gravação/multi-igreja.
- **Recomendação forte:** não fechar D-07.1 sem o POC (T-07.1).
