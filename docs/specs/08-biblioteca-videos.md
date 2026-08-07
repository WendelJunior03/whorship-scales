# 08 — Biblioteca de Vídeos das Músicas

## Objetivo

Permitir que **administradores** cadastrem vídeos (YouTube na v1) para ajudar os músicos
durante os ensaios, organizados por categoria e **relacionados às músicas**.

Exemplo de categorias por música: Vídeo Oficial, Playback, Tutorial, Ministração.

> É o **módulo mais simples** dos novos — bom candidato a ser o **primeiro** entregue depois
> da fundação, pra validar o padrão de "módulo novo dentro do multi-tenant + PRO".

---

## Contexto atual

- Existe o conceito de **repertório** por culto (`repertorio`: nome da música, tom, link).
- Não há entidade "música" reutilizável nem biblioteca de vídeos.

**Ponto de modelagem importante:** hoje "música" só existe como linha de `repertorio`
atrelada a um culto. Vídeos precisam se relacionar a **músicas** de forma reutilizável
(a mesma música aparece em vários cultos). Ver D-08.1.

---

## Decisões-chave

### D-08.1 — Entidade "Música" reutilizável vs. vídeos soltos

| Opção | Como | Prós | Contras |
|-------|------|------|---------|
| **A. Criar tabela `musicas`** (catálogo por org) e ligar `repertorio` e `videos` a ela | Música vira entidade de 1ª classe | Reuso real; vídeos/tom/histórico por música; base pra playlists futuras | Refatora o `repertorio` atual |
| **B. Vídeos ligados direto ao texto da música** | `videos` guarda o nome da música como texto | Mínimo esforço | Sem reuso; "mesma música" duplicada; frágil |

> **Recomendação:** **A**. Introduzir `musicas` como catálogo por organização destrava este
> módulo, playlists (futuro), estatísticas e melhora o próprio repertório. Vale o refactor.

**Decisão: ✅ A — Criar entidade `musicas`** (catálogo por organização) e ligar `repertorio` e `videos` a ela. Refatorar o repertório para referenciar o catálogo.

---

### D-08.2 — Armazenamento do vídeo do YouTube

A spec já define bem: **validar o link, armazenar apenas o ID**, exibir via **YouTube Embed**.

- Validar formatos de URL (`youtube.com/watch?v=`, `youtu.be/`, `shorts/`, com parâmetros).
- Guardar só o `video_id` (não a URL inteira).
- Player: **YouTube IFrame Embed API** (web/PWA). No nativo, usar um wrapper (ex.:
  `react-native-youtube-iframe`) — decidir conforme alvo PWA-first vs. nativo (ver spec 04).

**Decisão: ✅ Player web embed (YouTube IFrame API) na v1**; wrapper nativo (`react-native-youtube-iframe`) fica para a fase nativa ('PWA-first agora, nativo depois').

---

### D-08.3 — Recursos PRO (marcar agora, bloquear depois)

Da spec: Playlist, Favoritos, Histórico, Vídeos privados, Vimeo, Upload próprio → candidatos
a **PRO**. Na v1 tudo liberado, mas declarar as **chaves de recurso** (spec 03), ex.:
`videos.playlist`, `videos.upload`, `videos.privado`.

**Decisão: ✅ Free: cadastro via link do YouTube + categorias. PRO/futuro: playlist, favoritos, histórico, vídeos privados, Vimeo, upload próprio.**

---

## Modelo de dados (esboço)

```
musicas                     -- (se D-08.1 = A) catálogo por organização
  id            PK
  org_id        FK
  nome          text
  tom_padrao    text null
  created_at

videos
  id            PK
  org_id        FK
  musica_id     FK -> musicas.id   (ou texto livre se D-08.1 = B)
  provider      text default 'youtube'   -- prep. futura pra 'vimeo'
  video_id      text                     -- só o ID, não a URL
  categoria     text        -- 'oficial' | 'playback' | 'tutorial' | 'ministracao'
  titulo        text null
  adicionado_por FK -> membros.id
  created_at
```

Índices: `(org_id, musica_id)`. Todas as queries filtram por `org_id` (spec 01).

---

## Impacto no que já existe

- Se D-08.1 = A: `repertorio` passa a referenciar `musicas` (migration + ajuste nas telas de repertório e detalhes do culto).
- Backend: novo módulo `videos` (routes/controller/service/repo) + `musicas`.
- Frontend: aba de biblioteca de vídeos; player embed; UI de cadastro (admin) com validação de link; agrupamento por música/categoria.
- Permissões: só **admin** cadastra (spec 02); todos veem.

---

## Tarefas

- [x] **T-08.1** — ✅ Decidido (ver seção Decisões-chave). Fechar D-08.1, D-08.2, D-08.3.
- [ ] **T-08.2** — (Se A) Migration `musicas` + migrar `repertorio` pra referenciar.
  _Pronto quando:_ repertório existente continua funcionando referenciando o catálogo.
- [ ] **T-08.3** — Migration `videos` (com `org_id`, `provider`, `video_id`, `categoria`).
- [ ] **T-08.4** — Backend: CRUD de vídeos com validação de link e extração do `video_id`.
  _Pronto quando:_ link inválido é rejeitado e só o ID é salvo.
- [ ] **T-08.5** — Frontend: tela de biblioteca (lista por música/categoria) + player embed.
- [ ] **T-08.6** — Frontend: cadastro por admin (com preview do vídeo antes de salvar).
- [ ] **T-08.7** — Declarar chaves de recurso PRO (playlist/upload/privado) sem bloquear.
- [ ] **T-08.8** — Escopo de organização validado (vídeos de uma igreja não aparecem em outra).

---

## Dependências & riscos

- **Depende de:** 01 (org_id), 02 (só admin cadastra), 03 (chaves PRO).
- **Risco:** vídeos do YouTube ficarem privados/removidos (link quebrado). Mitigação: tratar
  erro no player + permitir editar/remover.
- **Risco baixo** no geral — bom módulo para abrir a Fase C.
