# Sistema de Gerenciamento de Escalas — Ministério de Louvor 🎶

## 1. Contexto e Problema

Hoje as escalas são montadas em Excel e enviadas por foto no grupo. Problemas:
- Não é dinâmico (qualquer mudança exige nova foto e reenvio)
- Cada pessoa precisa procurar seu nome na planilha inteira
- Sem histórico organizado de quem já tocou/cantou quando
- Trocas de última hora são difíceis de comunicar
- Sem visão individual de agenda

## 2. Modelo de Escala da Igreja

- **Cultos fixos:** quarta, sábado e domingo
- **Instrumentistas/ministros:** vínculo fixo a um dia da semana (recorrente, não muda toda semana)
- **Vocais:** rotativos — grupo de vocalistas que se revezam entre os cultos

Ou seja, o sistema tem duas lógicas diferentes:
1. Escala fixa (cadastro único + gestão de exceções/faltas)
2. Escala de vocais (rotação semanal com sugestão de balanceamento)

## 3. Stack Técnica

Reaproveitando a base do projeto BankJS, mantendo consistência de aprendizado:

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express 5 |
| Banco de dados | PostgreSQL (via `pg`, sem ORM — mesma abordagem do BankJS) |
| Autenticação | JWT + bcrypt |
| Frontend | React + Vite + Tailwind |
| Notificações | Twilio (WhatsApp/SMS) ou e-mail (a definir) |
| Deploy | Railway (mesmo ambiente do BankJS) |
| Arquitetura | MVC |

## 4. Modelagem do Banco de Dados

### `membros`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial PK | |
| nome | varchar | |
| telefone | varchar | para notificações |
| email | varchar | |
| senha_hash | varchar | bcrypt |
| tipo | enum | `admin`, `ministro`, `vocal`, `membro` |
| instrumento | varchar | nullable, ex: teclado, bateria, guitarra |
| ativo | boolean | |

### `escala_fixa`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial PK | |
| membro_id | FK → membros | |
| dia_semana | enum | `quarta`, `sabado`, `domingo` |
| funcao | varchar | ex: "teclado", "bateria", "ministro" |
| ativo | boolean | permite desativar sem apagar histórico |

### `cultos`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial PK | |
| data | date | |
| dia_semana | enum | derivado ou explícito |
| observacoes | text | nullable |

### `escala_vocal`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial PK | |
| culto_id | FK → cultos | |
| membro_id | FK → membros | |
| confirmado | boolean | default false |

### `excecoes`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial PK | |
| escala_fixa_id | FK → escala_fixa | |
| culto_id | FK → cultos | data específica da falta |
| substituto_id | FK → membros | nullable |
| motivo | varchar | nullable |

### `repertorio`
| Campo | Tipo | Descrição |
|---|---|---|
| id | serial PK | |
| culto_id | FK → cultos | |
| musica | varchar | |
| tom | varchar | nullable |
| link_referencia | varchar | nullable (cifra/YouTube) |
| ordem | int | ordem de execução |

## 5. Funcionalidades do Sistema (MVP)

### 5.1 Autenticação e Perfis
- Login com e-mail/senha (JWT)
- Papéis: admin (gerencia tudo), ministro (edita repertório e vê escala), membro (só visualiza sua própria agenda)

### 5.2 Escala Fixa
- CRUD de membros com instrumento e dia fixo
- Tela de visualização "quem toca quando" (visão geral por dia da semana)
- Registro de exceções: marcar falta pontual e indicar substituto

### 5.3 Escala de Vocais
- Cadastro do grupo de vocalistas disponíveis
- Geração/sugestão automática por culto, baseada em quem cantou menos recentemente (algoritmo simples de rotação)
- Ajuste manual pelo admin/ministro antes de publicar
- Confirmação de presença pelo próprio vocal (aceitar/recusar)

### 5.4 Repertório
- Cadastro de músicas por culto (nome, tom, link de referência)
- Ordem de execução
- Histórico de repertórios já usados (evitar repetir demais)

### 5.5 Notificações
- Aviso automático quando a escala do vocal é publicada ou alterada
- Aviso para o time fixo apenas em caso de exceção/troca
- Canal: WhatsApp (Twilio) como prioridade, e-mail como fallback

### 5.6 Visão Individual
- Cada membro loga e vê **apenas sua agenda** (próximos cultos que participa)
- Sem precisar procurar em planilha

## 6. Roadmap de Desenvolvimento Sugerido

**Fase 1 — Base**
- Modelagem do banco + migrations
- Auth (JWT/bcrypt) + papéis
- CRUD de membros e escala fixa

**Fase 2 — Vocais**
- CRUD de cultos
- Escala de vocais com lógica de rotação simples
- Confirmação de presença

**Fase 3 — Repertório e Exceções**
- CRUD de repertório
- Fluxo de exceções/substituição na escala fixa

**Fase 4 — Notificações**
- Integração com Twilio ou e-mail
- Disparo automático em criação/alteração de escala

**Fase 5 — Polimento**
- Frontend responsivo (mobile-first, já que a maioria acessa pelo celular)
- Dashboard geral para admin

## 7. Por que esse projeto é bom pro portfólio

- Regras de negócio diferentes do BankJS (agendamento, recorrência, notificações) — mostra variedade
- Problema real, resolvido para uso real (sua própria igreja)
- Dá pra demonstrar modelagem de dados mais rica (relacionamentos, exceções, histórico)
- Espaço natural pra usar integrações externas (Twilio) — bom diferencial em entrevista
