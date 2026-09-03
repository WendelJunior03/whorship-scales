import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { Calendar, DateData } from 'react-native-calendars';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EntradaHorario } from '@/components/EntradaHorario';
import { Header } from '@/components/Header';
import { OptionsMenu } from '@/components/OptionsMenu';
import { SeletorFuncao } from '@/components/SeletorFuncao';
import { useAuth } from '@/contexts/AuthContext';
import { MainStackParamList } from '@/navigation/types';
import * as cultosService from '@/services/cultos';
import * as ensaioService from '@/services/ensaio';
import * as escalaAvulsaService from '@/services/escalaAvulsa';
import * as escalaVocalService from '@/services/escalaVocal';
import * as membrosService from '@/services/membros';
import * as repertorioService from '@/services/repertorio';
import * as musicasService from '@/services/musicas';
import { MusicSearchResult } from '@/services/musicas';
import * as roteiroService from '@/services/roteiro';
import * as comentariosService from '@/services/comentarios';
import * as historicoService from '@/services/historico';
import { ApiError } from '@/services/api';
import { buscarTituloDoLink } from '@/utils/tituloLink';
import {
  Comentario,
  Culto,
  Ensaio,
  EnsaioParticipante,
  EscalaAvulsaDoCultoItem,
  EscalaVocalDoCultoItem,
  HistoricoItem,
  Membro,
  Repertorio,
  RoteiroItem,
  StatusEscalaVocal,
  SugestaoVocal,
} from '@/types';
import { LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import {
  formatDiaCompleto,
  formatDiaCurto,
  formatDiaSemana,
  formatHora,
  montarDataHoraISO,
} from '@/utils/date';
import { podeGerir, papelLabel } from '@/utils/papel';
import { confirmAction, notifyAction } from '@/utils/confirm';

const statusLabel: Record<StatusEscalaVocal, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
  falta: 'Falta',
};

const statusTone: Record<StatusEscalaVocal, 'warning' | 'success' | 'error'> = {
  pendente: 'warning',
  confirmado: 'success',
  recusado: 'error',
  falta: 'error',
};

function descreverHistorico(item: HistoricoItem): string {
  const ator = item.ator_nome ?? 'Alguém';
  const alvo = item.detalhe?.membro_nome ?? 'um membro';
  const funcao = item.detalhe?.funcao ? ` (${item.detalhe.funcao})` : '';
  switch (item.acao) {
    case 'adicionou_membro':
      return `${ator} adicionou ${alvo}${funcao}`;
    case 'removeu_membro':
      return `${ator} removeu ${alvo}${funcao}`;
    case 'confirmou':
      return `${ator} confirmou presença${funcao}`;
    case 'recusou':
      return `${ator} recusou a escala${funcao}`;
    case 'falta':
      return `${ator} registrou falta de ${alvo}${funcao}`;
    default:
      return `${ator}: ${item.acao}`;
  }
}

function formatDuracao(seg: number | null): string {
  if (seg == null) return '--:--';
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Aceita "3:43" (mm:ss) ou segundos puros ("223"); null se vazio/ inválido.
function parseDuracao(txt: string): number | null {
  const t = txt.trim();
  if (!t) return null;
  const m = /^(\d+):([0-5]?\d)$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/^\d+$/.test(t)) return Number(t);
  return null;
}

interface EquipeItem {
  chave: string;
  nome: string;
  foto?: string | null;
  funcao: string;
  status?: StatusEscalaVocal;
  origem: 'vocal' | 'avulsa';
  origemId: number;
}

export function DetalhesCultoScreen() {
  const { colors, modo } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const route = useRoute<RouteProp<MainStackParamList, 'DetalhesCulto'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { cultoId, abrirEdicaoVocal } = route.params;
  const { user } = useAuth();

  // Layout em 3 colunas (Repertório | Roteiro | Equipe) em telas largas; empilha no mobile.
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const colunasStyle = isWide ? styles.colunas : styles.colunasStack;
  const colunaStyle = isWide ? styles.coluna : styles.colunaStack;

  const [culto, setCulto] = useState<Culto | null>(null);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [equipe, setEquipe] = useState<EquipeItem[]>([]);
  const [suaFuncao, setSuaFuncao] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ensaio, setEnsaio] = useState<Ensaio | null>(null);
  const [ensaioParticipantes, setEnsaioParticipantes] = useState<EnsaioParticipante[]>([]);
  const [ensaioModalAberto, setEnsaioModalAberto] = useState(false);
  const [ensaioData, setEnsaioData] = useState<string | null>(null);
  const [ensaioHora, setEnsaioHora] = useState('');
  const [ensaioObservacoes, setEnsaioObservacoes] = useState('');
  const [salvandoEnsaio, setSalvandoEnsaio] = useState(false);
  const [excluindoEnsaio, setExcluindoEnsaio] = useState(false);
  const [participanteEnsaioPickerAberto, setParticipanteEnsaioPickerAberto] = useState(false);
  const [salvandoParticipanteEnsaio, setSalvandoParticipanteEnsaio] = useState(false);
  const [atualizandoParticipanteEnsaioId, setAtualizandoParticipanteEnsaioId] = useState<
    number | null
  >(null);
  const [convidandoEquipeEnsaio, setConvidandoEquipeEnsaio] = useState(false);

  const [repertorioModalAberto, setRepertorioModalAberto] = useState(false);
  const [novoNomeMusica, setNovoNomeMusica] = useState('');
  const [novoTom, setNovoTom] = useState('');
  const [novoLink, setNovoLink] = useState('');
  const [buscandoTitulo, setBuscandoTitulo] = useState(false);
  // Autocomplete (mesmo agregador de fontes da Biblioteca) no campo Nome do repertório.
  const [resultadosBuscaRepertorio, setResultadosBuscaRepertorio] = useState<MusicSearchResult[]>([]);
  const [buscandoListaRepertorio, setBuscandoListaRepertorio] = useState(false);
  const [erroBuscaRepertorio, setErroBuscaRepertorio] = useState<string | null>(null);
  const timerBuscaRepertorioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenBuscaRepertorioRef = useRef(0);
  const [salvandoMusica, setSalvandoMusica] = useState(false);
  const [excluindoMusicaId, setExcluindoMusicaId] = useState<number | null>(null);

  const [equipeModalAberto, setEquipeModalAberto] = useState(false);
  const [novoMembroEquipe, setNovoMembroEquipe] = useState<Membro | null>(null);
  const [novaFuncaoEquipe, setNovaFuncaoEquipe] = useState('');
  const [membroPickerAberto, setMembroPickerAberto] = useState(false);
  const [todosMembrosAtivos, setTodosMembrosAtivos] = useState<Membro[]>([]);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [salvandoEquipe, setSalvandoEquipe] = useState(false);
  const [excluindoEquipeChave, setExcluindoEquipeChave] = useState<string | null>(null);

  const [sugestaoVocal, setSugestaoVocal] = useState<SugestaoVocal[]>([]);
  const [selecionadosVocal, setSelecionadosVocal] = useState<SugestaoVocal[]>([]);
  const [modoEdicaoVocal, setModoEdicaoVocal] = useState(false);
  const [pickerVocalAberto, setPickerVocalAberto] = useState(false);
  const [indiceVocalEmEdicao, setIndiceVocalEmEdicao] = useState<number | null>(null);
  const [isPublicandoVocal, setIsPublicandoVocal] = useState(false);

  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const [roteiro, setRoteiro] = useState<RoteiroItem[]>([]);
  const [roteiroModalAberto, setRoteiroModalAberto] = useState(false);
  const [roteiroEditandoId, setRoteiroEditandoId] = useState<number | null>(null);
  const [roteiroTipo, setRoteiroTipo] = useState<'musica' | 'momento'>('musica');
  const [roteiroTitulo, setRoteiroTitulo] = useState('');
  const [roteiroTom, setRoteiroTom] = useState('');
  const [roteiroDuracao, setRoteiroDuracao] = useState(''); // mm:ss
  const [salvandoRoteiro, setSalvandoRoteiro] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cultoEncontrado = await cultosService.getCultoById(cultoId);

      const [
        repertoriosEncontrados,
        escalaVocalDoCulto,
        escalaAvulsaDoCulto,
        vocaisSugeridos,
        ensaioDoCulto,
        comentariosDoCulto,
        historicoDoCulto,
        roteiroDoCulto,
      ] = await Promise.all([
        repertorioService.getRepertorioDoCulto(cultoId),
        escalaVocalService.getEscalaVocalDoCulto(cultoId),
        escalaAvulsaService.getEscalaAvulsaDoCulto(cultoId),
        user?.papel === 'admin'
          ? escalaVocalService.getSugestaoVocais(cultoId)
          : Promise.resolve([]),
        ensaioService.getEnsaioDoCulto(cultoId),
        comentariosService.listarComentarios(cultoId),
        user && podeGerir(user)
          ? historicoService.listarHistorico(cultoId)
          : Promise.resolve([] as HistoricoItem[]),
        roteiroService.listarRoteiro(cultoId),
      ]);

      // Quem recusou some da equipe sozinho — não precisa remover na mão (o
      // registro continua existindo pra histórico, só não aparece mais aqui).
      const equipeVocal: EquipeItem[] = escalaVocalDoCulto
        .filter((item) => item.status !== 'recusado')
        .map((item) => ({
          chave: `vocal-${item.id}`,
          nome: item.nome,
          foto: item.foto,
          funcao: 'Vocal',
          status: item.status,
          origem: 'vocal',
          origemId: item.id,
        }));
      const equipeAvulsa: EquipeItem[] = escalaAvulsaDoCulto
        .filter((item) => item.status !== 'recusado')
        .map((item) => ({
          chave: `avulsa-${item.id}`,
          nome: item.nome,
          foto: item.foto,
          funcao: item.funcao,
          status: item.status,
          origem: 'avulsa',
          origemId: item.id,
        }));

      const minhaEscalaVocal = escalaVocalDoCulto.find(
        (item: EscalaVocalDoCultoItem) => item.membro_id === user?.id,
      );
      const minhaEscalaAvulsa = escalaAvulsaDoCulto.find(
        (item: EscalaAvulsaDoCultoItem) => item.membro_id === user?.id,
      );

      setCulto(cultoEncontrado);
      setRepertorios(repertoriosEncontrados);
      setEquipe([...equipeVocal, ...equipeAvulsa]);
      setSuaFuncao(minhaEscalaAvulsa?.funcao ?? (minhaEscalaVocal ? 'Vocal' : null));
      setSugestaoVocal(vocaisSugeridos);
      setSelecionadosVocal(vocaisSugeridos);
      setComentarios(comentariosDoCulto);
      setHistorico(historicoDoCulto);
      setRoteiro(roteiroDoCulto);
      setModoEdicaoVocal(Boolean(abrirEdicaoVocal));
      setEnsaio(ensaioDoCulto.ensaio);
      setEnsaioParticipantes(ensaioDoCulto.participantes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o culto.');
    } finally {
      setIsLoading(false);
    }
  }, [cultoId, user, abrirEdicaoVocal]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function handleAbrirMusica(link: string) {
    Linking.openURL(link).catch(() => {});
  }

  function abrirRepertorioModal() {
    if (timerBuscaRepertorioRef.current) clearTimeout(timerBuscaRepertorioRef.current);
    setNovoNomeMusica('');
    setNovoTom('');
    setNovoLink('');
    setResultadosBuscaRepertorio([]);
    setErroBuscaRepertorio(null);
    setRepertorioModalAberto(true);
  }

  // Busca ao vivo (mesmo agregador — Deezer/iTunes/GetSongBPM/Spotify — da
  // Biblioteca) enquanto digita o nome. Complementa o "cola o link e o nome
  // preenche sozinho" que já existia — os dois convivem, nenhum substitui o outro.
  async function buscarListaRepertorio(termo: string) {
    const minhaVez = ++tokenBuscaRepertorioRef.current;
    setBuscandoListaRepertorio(true);
    setErroBuscaRepertorio(null);
    try {
      const resultados = await musicasService.buscarAgregado(termo);
      if (tokenBuscaRepertorioRef.current !== minhaVez) return;
      setResultadosBuscaRepertorio(resultados);
    } catch {
      if (tokenBuscaRepertorioRef.current !== minhaVez) return;
      setResultadosBuscaRepertorio([]);
      setErroBuscaRepertorio('Não foi possível buscar agora.');
    } finally {
      if (tokenBuscaRepertorioRef.current === minhaVez) setBuscandoListaRepertorio(false);
    }
  }

  function aoDigitarNomeMusica(texto: string) {
    setNovoNomeMusica(texto);
    setErroBuscaRepertorio(null);
    if (timerBuscaRepertorioRef.current) clearTimeout(timerBuscaRepertorioRef.current);
    const termo = texto.trim();
    if (termo.length < 3) {
      tokenBuscaRepertorioRef.current++;
      setResultadosBuscaRepertorio([]);
      setBuscandoListaRepertorio(false);
      return;
    }
    timerBuscaRepertorioRef.current = setTimeout(() => buscarListaRepertorio(termo), 400);
  }

  // Escolheu um item da lista: preenche o nome; se o resultado tiver link do
  // Spotify, usa como link de referência (só se o campo ainda estiver vazio —
  // não sobrescreve o que a pessoa já colou). Tom continua sempre manual — o
  // agregador não expõe essa informação por enquanto.
  function escolherCandidatoRepertorio(item: MusicSearchResult) {
    setNovoNomeMusica(item.title);
    if (item.links?.spotify && !novoLink.trim()) setNovoLink(item.links.spotify);
    setResultadosBuscaRepertorio([]);
    setErroBuscaRepertorio(null);
  }

  // Ao sair do campo de link, tenta puxar o título (YouTube ou Spotify) pra
  // preencher o nome sozinho — outros links não fazem nada, sem erro.
  async function handleLinkPerdeuFoco() {
    if (!novoLink.trim()) return;
    setBuscandoTitulo(true);
    try {
      const titulo = await buscarTituloDoLink(novoLink.trim());
      if (titulo) {
        setNovoNomeMusica(titulo);
      }
    } finally {
      setBuscandoTitulo(false);
    }
  }

  async function handleAdicionarMusica() {
    if (!novoNomeMusica.trim() || !novoTom.trim() || !novoLink.trim()) {
      // Alert.alert não renderiza de forma confiável no react-native-web — a pessoa
      // clicava em "Adicionar" com campo vazio e nada visível acontecia.
      notifyAction('Preencha tudo', 'Nome, tom e link da música são obrigatórios.');
      return;
    }

    setSalvandoMusica(true);
    try {
      await repertorioService.criarRepertorio({
        cultoId,
        nome: novoNomeMusica.trim(),
        tom: novoTom.trim(),
        linkMusica: novoLink.trim(),
      });
      setRepertorioModalAberto(false);
      await carregarDados();
    } catch (err) {
      notifyAction(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível adicionar a música.',
      );
    } finally {
      setSalvandoMusica(false);
    }
  }

  function handleExcluirMusica(musica: Repertorio) {
    confirmAction(
      {
        title: 'Excluir música',
        message: `Remover "${musica.nome}" do repertório?`,
        confirmLabel: 'Excluir',
      },
      async () => {
        setExcluindoMusicaId(musica.id);
        try {
          await repertorioService.deletarRepertorio(musica.id);
          setRepertorios((prev) => prev.filter((r) => r.id !== musica.id));
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível excluir a música.',
          );
        } finally {
          setExcluindoMusicaId(null);
        }
      },
    );
  }

  async function garantirMembrosCarregados(): Promise<Membro[]> {
    if (todosMembrosAtivos.length > 0) return todosMembrosAtivos;
    setCarregandoMembros(true);
    try {
      const todos = await membrosService.getTodosMembros();
      const ativos = todos.filter((m) => m.ativo !== false);
      setTodosMembrosAtivos(ativos);
      return ativos;
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível carregar os membros.',
      );
      return [];
    } finally {
      setCarregandoMembros(false);
    }
  }

  function abrirEquipeModal() {
    setNovoMembroEquipe(null);
    setNovaFuncaoEquipe('');
    setEquipeModalAberto(true);
    garantirMembrosCarregados();
  }

  async function handleAdicionarNaEquipe() {
    if (!novoMembroEquipe || !novaFuncaoEquipe.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o membro e informe a função antes de adicionar.');
      return;
    }

    setSalvandoEquipe(true);
    try {
      await escalaAvulsaService.criarEscalaAvulsa({
        membroId: novoMembroEquipe.id,
        cultoId,
        funcao: novaFuncaoEquipe.trim(),
      });
      setEquipeModalAberto(false);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível adicionar à equipe.',
      );
    } finally {
      setSalvandoEquipe(false);
    }
  }

  function handleExcluirDaEquipe(item: EquipeItem) {
    if (!culto) return;

    confirmAction(
      {
        title: 'Remover da equipe',
        message: `Remover "${item.nome}" (${item.funcao}) da equipe deste culto?`,
        confirmLabel: 'Remover',
      },
      async () => {
        setExcluindoEquipeChave(item.chave);
        try {
          if (item.origem === 'vocal') {
            await escalaVocalService.deletarEscalaVocal(item.origemId);
          } else {
            await escalaAvulsaService.deletarEscalaAvulsa(item.origemId);
          }
          await carregarDados();
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível remover da equipe.',
          );
        } finally {
          setExcluindoEquipeChave(null);
        }
      },
    );
  }

  function handleRegistrarFalta(item: EquipeItem) {
    confirmAction(
      {
        title: 'Registrar falta',
        message: `Marcar falta de "${item.nome}" (${item.funcao}) neste culto? Ele será notificado.`,
        confirmLabel: 'Registrar falta',
      },
      async () => {
        setExcluindoEquipeChave(item.chave);
        try {
          if (item.origem === 'vocal') {
            await escalaVocalService.registrarFalta(item.origemId);
          } else if (item.origem === 'avulsa') {
            await escalaAvulsaService.registrarFalta(item.origemId);
          }
          await carregarDados();
        } catch (err) {
          notifyAction(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível registrar a falta.',
          );
        } finally {
          setExcluindoEquipeChave(null);
        }
      },
    );
  }

  function abrirEnsaioModal() {
    if (ensaio) {
      setEnsaioData(ensaio.data_hora.slice(0, 10));
      setEnsaioHora(formatHora(ensaio.data_hora));
      setEnsaioObservacoes(ensaio.observacoes ?? '');
    } else {
      setEnsaioData(null);
      setEnsaioHora('');
      setEnsaioObservacoes('');
    }
    setEnsaioModalAberto(true);
  }

  async function handleSalvarEnsaio() {
    if (!ensaioData || !ensaioHora.trim()) {
      Alert.alert('Preencha tudo', 'Selecione o dia e informe o horário do ensaio.');
      return;
    }

    const dataHora = montarDataHoraISO(ensaioData, ensaioHora.trim());
    if (!dataHora) {
      Alert.alert('Horário inválido', 'Use o formato HH:mm, por exemplo 19:00.');
      return;
    }

    setSalvandoEnsaio(true);
    try {
      if (ensaio) {
        await ensaioService.atualizarEnsaio(ensaio.id, {
          dataHora,
          observacoes: ensaioObservacoes.trim() || null,
        });
      } else {
        await ensaioService.criarEnsaio({
          cultoId,
          dataHora,
          observacoes: ensaioObservacoes.trim() || null,
        });
      }
      setEnsaioModalAberto(false);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível salvar o ensaio.',
      );
    } finally {
      setSalvandoEnsaio(false);
    }
  }

  function handleExcluirEnsaio() {
    if (!ensaio) return;

    confirmAction(
      {
        title: 'Excluir ensaio',
        message: 'Isso remove o ensaio e a lista de participantes dele. Confirmar?',
        confirmLabel: 'Excluir',
      },
      async () => {
        setExcluindoEnsaio(true);
        try {
          await ensaioService.excluirEnsaio(ensaio.id);
          await carregarDados();
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível excluir o ensaio.',
          );
        } finally {
          setExcluindoEnsaio(false);
        }
      },
    );
  }

  function abrirParticipanteEnsaioModal() {
    setParticipanteEnsaioPickerAberto(true);
    garantirMembrosCarregados();
  }

  async function handleAdicionarParticipanteEnsaio(membro: Membro) {
    if (!ensaio) return;

    setParticipanteEnsaioPickerAberto(false);
    setSalvandoParticipanteEnsaio(true);
    try {
      await ensaioService.adicionarParticipante(ensaio.id, membro.id);
      await carregarDados();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível adicionar o participante.',
      );
    } finally {
      setSalvandoParticipanteEnsaio(false);
    }
  }

  // Convida de uma vez todo mundo já escalado no culto (fixa, vocal e avulsa) pro
  // ensaio, sem precisar adicionar pessoa por pessoa. `equipe` só tem o nome (não o
  // membro_id) — cruza com `todosMembrosAtivos` pra achar quem é quem, igual
  // `membrosParaEscolher` já faz pra montar a lista de quem falta adicionar.
  async function handleConvidarEquipeDoCulto() {
    if (!ensaio) return;

    setConvidandoEquipeEnsaio(true);
    try {
      const membros = await garantirMembrosCarregados();

      const jaConvidados = new Set(ensaioParticipantes.map((p) => p.membro_id));
      const nomesDaEquipe = new Set(equipe.map((item) => item.nome));
      const membrosParaConvidar = membros.filter(
        (m) => nomesDaEquipe.has(m.nome) && !jaConvidados.has(m.id),
      );

      if (membrosParaConvidar.length === 0) {
        notifyAction('Ninguém pra convidar', 'Todo mundo da equipe já está no ensaio.');
        return;
      }

      const resultados = await Promise.allSettled(
        membrosParaConvidar.map((membro) =>
          ensaioService.adicionarParticipante(ensaio.id, membro.id),
        ),
      );
      await carregarDados();

      const falhas = resultados.filter((r) => r.status === 'rejected').length;
      const total = membrosParaConvidar.length;
      if (falhas === 0) {
        notifyAction(
          'Equipe convidada',
          `${total} membro${total > 1 ? 's' : ''} da equipe foram convidados pro ensaio.`,
        );
      } else {
        notifyAction(
          'Convidado com ressalvas',
          `${total - falhas} de ${total} foram convidados. Os demais podem já estar no ensaio.`,
        );
      }
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível convidar a equipe.',
      );
    } finally {
      setConvidandoEquipeEnsaio(false);
    }
  }

  function handleRemoverParticipanteEnsaio(participante: EnsaioParticipante) {
    confirmAction(
      {
        title: 'Remover do ensaio',
        message: `Remover "${participante.nome}" do ensaio?`,
        confirmLabel: 'Remover',
      },
      async () => {
        setAtualizandoParticipanteEnsaioId(participante.id);
        try {
          await ensaioService.removerParticipante(participante.id);
          await carregarDados();
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível remover o participante.',
          );
        } finally {
          setAtualizandoParticipanteEnsaioId(null);
        }
      },
    );
  }

  function handleRegistrarFaltaEnsaio(participante: EnsaioParticipante) {
    confirmAction(
      {
        title: 'Registrar falta',
        message: `Marcar falta de "${participante.nome}" no ensaio? Ele será notificado.`,
        confirmLabel: 'Registrar falta',
      },
      async () => {
        setAtualizandoParticipanteEnsaioId(participante.id);
        try {
          await ensaioService.registrarFaltaEnsaio(participante.id);
          await carregarDados();
        } catch (err) {
          notifyAction(
            'Erro',
            err instanceof ApiError ? err.message : 'Não foi possível registrar a falta.',
          );
        } finally {
          setAtualizandoParticipanteEnsaioId(null);
        }
      },
    );
  }

  function ativarModoEdicaoVocal() {
    setModoEdicaoVocal(true);
    garantirMembrosCarregados();
  }

  function cancelarEdicaoVocal() {
    setModoEdicaoVocal(false);
    setSelecionadosVocal(sugestaoVocal);
    fecharPickerVocal();
  }

  function abrirPickerVocalParaTrocar(indice: number) {
    setIndiceVocalEmEdicao(indice);
    setPickerVocalAberto(true);
  }

  function abrirPickerVocalParaAdicionar() {
    setIndiceVocalEmEdicao(null);
    setPickerVocalAberto(true);
  }

  function fecharPickerVocal() {
    setPickerVocalAberto(false);
    setIndiceVocalEmEdicao(null);
  }

  function selecionarVocal(membro: Membro) {
    const novoItem: SugestaoVocal = { id: membro.id, nome: membro.nome, ultima_vez: null };
    setSelecionadosVocal((prev) => {
      if (indiceVocalEmEdicao !== null) {
        const copia = [...prev];
        copia[indiceVocalEmEdicao] = novoItem;
        return copia;
      }
      return [...prev, novoItem];
    });
    fecharPickerVocal();
  }

  function removerVocal(indice: number) {
    setSelecionadosVocal((prev) => prev.filter((_, i) => i !== indice));
  }

  async function publicarEscalaVocal() {
    if (selecionadosVocal.length === 0) {
      notifyAction('Nada para publicar', 'Adicione ao menos um vocal antes de publicar.');
      return;
    }

    setIsPublicandoVocal(true);
    const resultados = await Promise.allSettled(
      selecionadosVocal.map((vocal) =>
        escalaVocalService.criarEscalaVocal({ membroId: vocal.id, cultoId }),
      ),
    );
    const total = selecionadosVocal.length;
    setIsPublicandoVocal(false);
    setModoEdicaoVocal(false);
    await carregarDados();

    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    if (falhas === 0) {
      notifyAction(
        'Escala publicada',
        'A escala de vocais foi publicada. Cada vocal escalado recebe uma notificação por e-mail.',
      );
    } else {
      notifyAction(
        'Publicado com ressalvas',
        `${total - falhas} de ${total} vocais foram escalados. Os demais podem já estar nessa escala.`,
      );
    }
  }

  async function handleEnviarComentario() {
    const texto = novoComentario.trim();
    if (!texto) return;

    setEnviandoComentario(true);
    try {
      const criado = await comentariosService.criarComentario(cultoId, texto);
      setComentarios((prev) => [...prev, criado]);
      setNovoComentario('');
    } catch (err) {
      notifyAction('Erro', err instanceof ApiError ? err.message : 'Não foi possível enviar o comentário.');
    } finally {
      setEnviandoComentario(false);
    }
  }

  function abrirRoteiroModal(item?: RoteiroItem) {
    if (item) {
      setRoteiroEditandoId(item.id);
      setRoteiroTipo(item.tipo);
      setRoteiroTitulo(item.titulo ?? '');
      setRoteiroTom(item.tom ?? '');
      setRoteiroDuracao(item.duracao_seg != null ? formatDuracao(item.duracao_seg) : '');
    } else {
      setRoteiroEditandoId(null);
      setRoteiroTipo('musica');
      setRoteiroTitulo('');
      setRoteiroTom('');
      setRoteiroDuracao('');
    }
    setRoteiroModalAberto(true);
  }

  async function handleSalvarRoteiro() {
    if (!roteiroTitulo.trim()) {
      notifyAction('Preencha', 'Informe o título do item.');
      return;
    }
    const duracaoSeg = parseDuracao(roteiroDuracao);
    setSalvandoRoteiro(true);
    try {
      if (roteiroEditandoId) {
        await roteiroService.atualizarItem(roteiroEditandoId, {
          titulo: roteiroTitulo.trim(),
          tom: roteiroTom.trim() || null,
          duracaoSeg,
        });
      } else {
        await roteiroService.criarItem({
          cultoId,
          tipo: roteiroTipo,
          titulo: roteiroTitulo.trim(),
          tom: roteiroTom.trim() || null,
          duracaoSeg,
        });
      }
      setRoteiroModalAberto(false);
      setRoteiro(await roteiroService.listarRoteiro(cultoId));
    } catch (err) {
      notifyAction('Erro', err instanceof ApiError ? err.message : 'Não foi possível salvar o item.');
    } finally {
      setSalvandoRoteiro(false);
    }
  }

  function handleExcluirRoteiro(item: RoteiroItem) {
    confirmAction(
      {
        title: 'Remover do roteiro',
        message: `Remover "${item.titulo}" do roteiro?`,
        confirmLabel: 'Remover',
      },
      async () => {
        try {
          await roteiroService.deletarItem(item.id);
          setRoteiro((prev) => prev.filter((i) => i.id !== item.id));
        } catch (err) {
          notifyAction('Erro', err instanceof ApiError ? err.message : 'Não foi possível remover.');
        }
      },
    );
  }

  async function handleMoverRoteiro(index: number, direcao: -1 | 1) {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= roteiro.length) return;
    const reordenado = [...roteiro];
    [reordenado[index], reordenado[alvo]] = [reordenado[alvo], reordenado[index]];
    setRoteiro(reordenado);
    try {
      await roteiroService.reordenar(cultoId, reordenado.map((i) => i.id));
    } catch {
      setRoteiro(await roteiroService.listarRoteiro(cultoId));
    }
  }

  // Volta pra um lugar seguro — evita ficar preso quando o culto não existe mais
  // (ex.: navegação restaurada apontando pra um culto apagado).
  function voltarSeguro() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !culto) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{error ?? 'Culto não encontrado.'}</Text>
        <Button title="Voltar" onPress={voltarSeguro} style={styles.retryButton} />
        <Button
          title="Tentar novamente"
          onPress={carregarDados}
          variant="outline"
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  const vocaisParaEscolher = todosMembrosAtivos.filter(
    (m) => m.papel === 'vocal' && !selecionadosVocal.some((s) => s.id === m.id),
  );

  // Quem já está na equipe do culto (fixa, vocal ou avulsa) some da lista de
  // adicionar — evita escalar a mesma pessoa duas vezes pro mesmo culto.
  const membrosParaEscolher = todosMembrosAtivos.filter(
    (m) => !equipe.some((item) => item.nome === m.nome),
  );

  // "Confirmados x de y" considera só quem tem status (vocal/avulsa); a escala
  // fixa não tem confirmação por culto (ausência dela vira exceção).
  const equipeConfirmavel = equipe.filter((item) => item.status !== undefined);
  const totalConfirmados = equipeConfirmavel.filter((item) => item.status === 'confirmado').length;

  const membrosParaEscolherEnsaio = todosMembrosAtivos.filter(
    (m) => !ensaioParticipantes.some((p) => p.membro_id === m.id),
  );
  const ensaioConfirmados = ensaioParticipantes.filter((p) => p.status === 'confirmado').length;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Detalhes do Culto" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={styles.data}>{formatDiaCompleto(culto.data_hora)}</Text>
          <Text style={styles.hora}>{formatHora(culto.data_hora)}</Text>
          <View style={styles.tipoRow}>
            <Icon name="bookmark-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.tipo}>
              {culto.tipo ?? `Culto de ${formatDiaSemana(culto.data_hora)}`}
            </Text>
          </View>
        </Card>

        <View style={colunasStyle}>
          <View style={colunaStyle}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Repertório</Text>
          {user && podeGerir(user) && (
            <TouchableOpacity
              onPress={abrirRepertorioModal}
              accessibilityRole="button"
              accessibilityLabel="Adicionar música ao repertório"
            >
              <Icon name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {repertorios.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhuma música cadastrada ainda.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {repertorios.map((musica, index) => (
              <TouchableOpacity
                key={musica.id}
                style={styles.musicaRow}
                activeOpacity={musica.link_musica ? 0.7 : 1}
                disabled={!musica.link_musica}
                onPress={() => musica.link_musica && handleAbrirMusica(musica.link_musica)}
              >
                <Text style={styles.musicaNumero}>{String(index + 1).padStart(2, '0')}</Text>
                {musica.capa_url ? (
                  <Image source={{ uri: musica.capa_url }} style={styles.musicaCapa} />
                ) : (
                  <View style={styles.musicaCapaFallback}>
                    <Icon name="musical-notes-outline" size={16} color={colors.textMuted} />
                  </View>
                )}
                <Text style={styles.musicaNome}>{musica.nome}</Text>
                <Badge
                  label={musica.tom}
                  tone="neutral"
                  style={styles.tomBadge}
                  textStyle={styles.tomBadgeText}
                />
                {user && podeGerir(user) && (
                  <OptionsMenu
                    loading={excluindoMusicaId === musica.id}
                    actions={[
                      {
                        label: 'Excluir música',
                        icon: 'trash-outline',
                        destructive: true,
                        onPress: () => handleExcluirMusica(musica),
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}

          </View>
          <View style={colunaStyle}>
        {/* Roteiro (setlist cronometrado) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Roteiro</Text>
          {user && podeGerir(user) && (
            <TouchableOpacity
              onPress={() => abrirRoteiroModal()}
              accessibilityRole="button"
              accessibilityLabel="Adicionar item ao roteiro"
            >
              <Icon name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {roteiro.length > 0 && (
          <Text style={styles.sectionSubtitle}>
            Total: {formatDuracao(roteiro.reduce((s, i) => s + (i.duracao_seg ?? 0), 0))}
          </Text>
        )}
        {roteiro.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Roteiro vazio.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {roteiro.map((item, index) => (
              <View key={item.id} style={styles.roteiroRow}>
                <View style={styles.roteiroNum}>
                  <Text style={styles.roteiroNumText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roteiroTitulo} numberOfLines={1}>
                    {item.titulo}
                    {item.tipo === 'musica' && item.tom ? (
                      <Text style={styles.roteiroTom}>{'  ·  '}{item.tom}</Text>
                    ) : null}
                  </Text>
                  {item.tipo === 'momento' ? <Text style={styles.roteiroTag}>momento</Text> : null}
                </View>
                <Text style={styles.roteiroDuracao}>{formatDuracao(item.duracao_seg)}</Text>
                {user && podeGerir(user) && (
                  <View style={styles.roteiroAcoes}>
                    <TouchableOpacity onPress={() => handleMoverRoteiro(index, -1)} hitSlop={6} disabled={index === 0} accessibilityLabel="Mover para cima">
                      <Icon name="chevron-up" size={18} color={index === 0 ? colors.textMuted : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleMoverRoteiro(index, 1)} hitSlop={6} disabled={index === roteiro.length - 1} accessibilityLabel="Mover para baixo">
                      <Icon name="chevron-down" size={18} color={index === roteiro.length - 1 ? colors.textMuted : colors.textSecondary} />
                    </TouchableOpacity>
                    <OptionsMenu
                      actions={[
                        { label: 'Editar', icon: 'create-outline', onPress: () => abrirRoteiroModal(item) },
                        { label: 'Remover', icon: 'trash-outline', destructive: true, onPress: () => handleExcluirRoteiro(item) },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}

          </View>
          <View style={colunaStyle}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Equipe</Text>
          {user && podeGerir(user) && (
            <TouchableOpacity
              onPress={abrirEquipeModal}
              accessibilityRole="button"
              accessibilityLabel="Adicionar membro à equipe"
            >
              <Icon name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {equipeConfirmavel.length > 0 && (
          <Text style={styles.sectionSubtitle}>
            Confirmados {totalConfirmados} de {equipeConfirmavel.length}
          </Text>
        )}
        {equipe.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum membro escalado ainda.</Text>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.equipeRow}
          >
            {equipe.map((membro) => {
              const podeExcluir = Boolean(user && podeGerir(user));

              return (
                <View key={membro.chave} style={styles.membroAvatarBlock}>
                  <Avatar nome={membro.nome} fotoUrl={membro.foto} size={48} />
                  <Text style={styles.membroNome} numberOfLines={1}>
                    {membro.nome}
                  </Text>
                  <Text style={styles.membroFuncao} numberOfLines={1}>
                    {membro.funcao}
                  </Text>
                  {membro.status && (
                    <Badge label={statusLabel[membro.status]} tone={statusTone[membro.status]} />
                  )}
                  {podeExcluir && (
                    <OptionsMenu
                      loading={excluindoEquipeChave === membro.chave}
                      actions={[
                        ...(membro.status && membro.status !== 'falta'
                          ? [
                              {
                                label: 'Registrar falta',
                                icon: 'alert-circle-outline' as const,
                                onPress: () => handleRegistrarFalta(membro),
                              },
                            ]
                          : []),
                        {
                          label: 'Remover da equipe',
                          icon: 'trash-outline' as const,
                          destructive: true,
                          onPress: () => handleExcluirDaEquipe(membro),
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ensaio</Text>
          {!ensaio && user && podeGerir(user) && (
            <TouchableOpacity
              onPress={abrirEnsaioModal}
              accessibilityRole="button"
              accessibilityLabel="Criar ensaio"
            >
              <Icon name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {!ensaio ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum ensaio marcado ainda.</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.ensaioCard}>
              <View style={styles.ensaioTopo}>
                <View>
                  <Text style={styles.ensaioData}>{formatDiaCompleto(ensaio.data_hora)}</Text>
                  <Text style={styles.ensaioHora}>{formatHora(ensaio.data_hora)}</Text>
                </View>
                {user && podeGerir(user) && (
                  <OptionsMenu
                    loading={excluindoEnsaio}
                    actions={[
                      { label: 'Editar ensaio', icon: 'create-outline', onPress: abrirEnsaioModal },
                      {
                        label: 'Excluir ensaio',
                        icon: 'trash-outline',
                        destructive: true,
                        onPress: handleExcluirEnsaio,
                      },
                    ]}
                  />
                )}
              </View>
              {ensaio.observacoes && (
                <Text style={styles.ensaioObservacoes}>{ensaio.observacoes}</Text>
              )}
            </Card>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionSubtitleTitulo}>Participantes</Text>
              {user && podeGerir(user) && (
                <TouchableOpacity
                  onPress={abrirParticipanteEnsaioModal}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar participante ao ensaio"
                >
                  <Icon name="add-circle-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            {equipe.length > 0 && user && podeGerir(user) && (
              <TouchableOpacity
                style={styles.adicionarRow}
                onPress={handleConvidarEquipeDoCulto}
                disabled={convidandoEquipeEnsaio}
              >
                {convidandoEquipeEnsaio ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name="people-outline" size={18} color={colors.primary} />
                )}
                <Text style={styles.adicionarTexto}>Convidar toda a equipe do culto</Text>
              </TouchableOpacity>
            )}
            {ensaioParticipantes.length > 0 && (
              <Text style={styles.sectionSubtitle}>
                Confirmados {ensaioConfirmados} de {ensaioParticipantes.length}
              </Text>
            )}
            {ensaioParticipantes.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>Ninguém convidado ainda.</Text>
              </Card>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.equipeRow}
              >
                {ensaioParticipantes.map((participante) => (
                  <View key={participante.id} style={styles.membroAvatarBlock}>
                    <Avatar nome={participante.nome} fotoUrl={participante.foto} size={48} />
                    <Text style={styles.membroNome} numberOfLines={1}>
                      {participante.nome}
                    </Text>
                    <Badge
                      label={statusLabel[participante.status]}
                      tone={statusTone[participante.status]}
                    />
                    {user && podeGerir(user) && (
                      <OptionsMenu
                        loading={atualizandoParticipanteEnsaioId === participante.id}
                        actions={[
                          ...(participante.status !== 'falta'
                            ? [
                                {
                                  label: 'Registrar falta',
                                  icon: 'alert-circle-outline' as const,
                                  onPress: () => handleRegistrarFaltaEnsaio(participante),
                                },
                              ]
                            : []),
                          {
                            label: 'Remover do ensaio',
                            icon: 'trash-outline' as const,
                            destructive: true,
                            onPress: () => handleRemoverParticipanteEnsaio(participante),
                          },
                        ]}
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {user?.papel === 'admin' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {modoEdicaoVocal ? 'Escala de vocais em edição' : 'Escala de vocais — sugestão'}
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>Baseado em menor participação recente</Text>

            {selecionadosVocal.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>Nenhum vocal na escala ainda.</Text>
              </Card>
            ) : (
              <Card style={styles.listCard}>
                {selecionadosVocal.map((vocal, index) => (
                  <View key={`${vocal.id}-${index}`} style={styles.vocalRow}>
                    <View style={styles.vocalNumero}>
                      <Text style={styles.vocalNumeroText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.vocalNome}>{vocal.nome}</Text>
                    <Text style={styles.vocalData}>
                      {vocal.ultima_vez ? formatDiaCurto(vocal.ultima_vez) : '—'}
                    </Text>
                    {modoEdicaoVocal && (
                      <View style={styles.vocalAcoes}>
                        <TouchableOpacity
                          onPress={() => abrirPickerVocalParaTrocar(index)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Trocar vocal ${vocal.nome}`}
                        >
                          <Icon name="swap-horizontal" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removerVocal(index)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover vocal ${vocal.nome}`}
                        >
                          <Icon name="close-circle" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                {modoEdicaoVocal && (
                  <TouchableOpacity
                    style={styles.adicionarRow}
                    onPress={abrirPickerVocalParaAdicionar}
                  >
                    <Icon name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.adicionarTexto}>Adicionar vocal</Text>
                  </TouchableOpacity>
                )}
              </Card>
            )}

            {!modoEdicaoVocal ? (
              <View style={styles.vocalBotoes}>
                {selecionadosVocal.length > 0 && (
                  <Button
                    title="Aceitar Sugestão"
                    onPress={publicarEscalaVocal}
                    loading={isPublicandoVocal}
                  />
                )}
                <Button
                  title="Editar Manualmente"
                  onPress={ativarModoEdicaoVocal}
                  variant="outline"
                />
              </View>
            ) : (
              <View style={styles.vocalBotoes}>
                <Button
                  title="Publicar Escala"
                  onPress={publicarEscalaVocal}
                  loading={isPublicandoVocal}
                />
                <Button
                  title="Cancelar edição"
                  onPress={cancelarEdicaoVocal}
                  variant="outline"
                  disabled={isPublicandoVocal}
                />
              </View>
            )}
          </View>
        )}

        {suaFuncao && (
          <Card style={styles.suaFuncaoCard}>
            <Text style={styles.suaFuncaoLabel}>Sua função</Text>
            <View style={styles.suaFuncaoRow}>
              <Icon name="musical-notes" size={20} color={colors.primary} />
              <Text style={styles.suaFuncaoValor}>{suaFuncao}</Text>
            </View>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comentários</Text>
        </View>
        {comentarios.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum comentário ainda. Seja o primeiro!</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {comentarios.map((c) => (
              <View key={c.id} style={styles.comentarioItem}>
                <View style={styles.comentarioCabecalho}>
                  <Text style={styles.comentarioAutor}>{c.autor_nome}</Text>
                  <Text style={styles.comentarioHora}>{formatHora(c.created_at)}</Text>
                </View>
                <Text style={styles.comentarioTexto}>{c.texto}</Text>
              </View>
            ))}
          </Card>
        )}
        <View style={styles.comentarioInputRow}>
          <TextInput
            style={styles.comentarioInput}
            placeholder="Digite aqui…"
            placeholderTextColor={colors.textMuted}
            value={novoComentario}
            onChangeText={setNovoComentario}
            multiline
            onSubmitEditing={handleEnviarComentario}
          />
          <TouchableOpacity
            style={[styles.comentarioEnviar, (!novoComentario.trim() || enviandoComentario) && styles.comentarioEnviarOff]}
            onPress={handleEnviarComentario}
            disabled={!novoComentario.trim() || enviandoComentario}
            accessibilityRole="button"
            accessibilityLabel="Enviar comentário"
          >
            {enviandoComentario ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Icon name="send" size={18} color={colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>

        {user && podeGerir(user) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Histórico</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Apagado ~1 semana após a data da escala.</Text>
            {historico.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>Nenhuma alteração registrada ainda.</Text>
              </Card>
            ) : (
              <Card style={styles.listCard}>
                {historico.map((h) => (
                  <View key={h.id} style={styles.historicoItem}>
                    <View style={styles.historicoDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historicoTexto}>{descreverHistorico(h)}</Text>
                      <Text style={styles.historicoHora}>
                        {formatDiaCurto(h.created_at)} · {formatHora(h.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={repertorioModalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setRepertorioModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar música</Text>

            <View style={styles.buscaRepertorioWrap}>
              <View style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                  style={[styles.modalTextInput, { flex: 1 }]}
                  placeholder="Nome da música"
                  placeholderTextColor={colors.textMuted}
                  value={novoNomeMusica}
                  onChangeText={aoDigitarNomeMusica}
                />
                {(buscandoTitulo || buscandoListaRepertorio) && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
              {resultadosBuscaRepertorio.length > 0 && (
                <View style={styles.resultadosRepertorioLista}>
                  {resultadosBuscaRepertorio.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultadoRepertorioItem}
                      onPress={() => escolherCandidatoRepertorio(item)}
                    >
                      {item.coverUrl ? (
                        <Image source={{ uri: item.coverUrl }} style={styles.resultadoRepertorioCapa} />
                      ) : (
                        <View style={styles.resultadoRepertorioCapaFallback}>
                          <Icon name="musical-notes-outline" size={16} color={colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.resultadoRepertorioTextos}>
                        <Text style={styles.resultadoRepertorioTitulo} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.resultadoRepertorioMeta} numberOfLines={1}>{item.artist || 'Artista desconhecido'}</Text>
                      </View>
                      <Icon name="add-circle-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {erroBuscaRepertorio && <Text style={styles.buscaRepertorioErro}>{erroBuscaRepertorio}</Text>}
            </View>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Tom (ex: G, Em)"
                placeholderTextColor={colors.textMuted}
                value={novoTom}
                onChangeText={setNovoTom}
              />
            </View>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Link de referência"
                placeholderTextColor={colors.textMuted}
                value={novoLink}
                onChangeText={setNovoLink}
                onBlur={handleLinkPerdeuFoco}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <Text style={styles.linkDica}>
              Link do YouTube ou Spotify? O nome da música é preenchido automaticamente.
            </Text>

            <Button
              title="Adicionar"
              onPress={handleAdicionarMusica}
              loading={salvandoMusica}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setRepertorioModalAberto(false)}
              disabled={salvandoMusica}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: adicionar/editar item do roteiro */}
      <Modal
        visible={roteiroModalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setRoteiroModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {roteiroEditandoId ? 'Editar item' : 'Adicionar ao roteiro'}
            </Text>

            {!roteiroEditandoId && (
              <View style={styles.roteiroTipoLinha}>
                {(['musica', 'momento'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.roteiroTipoChip, roteiroTipo === t && styles.roteiroTipoChipAtivo]}
                    onPress={() => setRoteiroTipo(t)}
                  >
                    <Text style={[styles.roteiroTipoText, roteiroTipo === t && styles.roteiroTipoTextAtivo]}>
                      {t === 'musica' ? 'Música' : 'Momento'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.formLabel}>Título</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder={roteiroTipo === 'musica' ? 'Nome da música' : 'Ex: Oração, Avisos'}
                placeholderTextColor={colors.textMuted}
                value={roteiroTitulo}
                onChangeText={setRoteiroTitulo}
              />
            </View>

            {roteiroTipo === 'musica' && (
              <>
                <Text style={styles.formLabel}>Tom (opcional)</Text>
                <View style={styles.modalInput}>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Ex: G, Em"
                    placeholderTextColor={colors.textMuted}
                    value={roteiroTom}
                    onChangeText={setRoteiroTom}
                  />
                </View>
              </>
            )}

            <Text style={styles.formLabel}>Duração (mm:ss, opcional)</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="3:43"
                placeholderTextColor={colors.textMuted}
                value={roteiroDuracao}
                onChangeText={setRoteiroDuracao}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <Button
              title={roteiroEditandoId ? 'Salvar' : 'Adicionar'}
              onPress={handleSalvarRoteiro}
              loading={salvandoRoteiro}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setRoteiroModalAberto(false)}
              disabled={salvandoRoteiro}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={equipeModalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setEquipeModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar à equipe</Text>

            <TouchableOpacity style={styles.modalInput} onPress={() => setMembroPickerAberto(true)}>
              <Text style={novoMembroEquipe ? styles.modalTextInput : styles.modalPlaceholder}>
                {novoMembroEquipe ? novoMembroEquipe.nome : 'Selecionar membro'}
              </Text>
            </TouchableOpacity>
            <SeletorFuncao selecionado={novaFuncaoEquipe || null} onChange={setNovaFuncaoEquipe} />

            <Button
              title="Adicionar"
              onPress={handleAdicionarNaEquipe}
              loading={salvandoEquipe}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setEquipeModalAberto(false)}
              disabled={salvandoEquipe}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={membroPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setMembroPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPicker}>
            <Text style={styles.modalTitle}>Escolher membro</Text>
            {carregandoMembros ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {membrosParaEscolher.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum membro disponível.</Text>
                ) : (
                  membrosParaEscolher.map((membro) => (
                    <TouchableOpacity
                      key={membro.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setNovoMembroEquipe(membro);
                        setMembroPickerAberto(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{membro.nome}</Text>
                      <Text style={styles.modalItemSubtext}>{papelLabel[membro.papel]}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setMembroPickerAberto(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={pickerVocalAberto}
        animationType="slide"
        transparent
        onRequestClose={fecharPickerVocal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPicker}>
            <Text style={styles.modalTitle}>Escolher vocal</Text>
            {carregandoMembros ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {vocaisParaEscolher.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum vocal disponível.</Text>
                ) : (
                  vocaisParaEscolher.map((membro) => (
                    <TouchableOpacity
                      key={membro.id}
                      style={styles.modalItem}
                      onPress={() => selecionarVocal(membro)}
                    >
                      <Text style={styles.modalItemText}>{membro.nome}</Text>
                      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <Button title="Cancelar" variant="outline" onPress={fecharPickerVocal} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={ensaioModalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setEnsaioModalAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentEnsaio}>
            <Text style={styles.modalTitle}>{ensaio ? 'Editar ensaio' : 'Novo ensaio'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Dia</Text>
              <Calendar
                // `react-native-calendars` não reage bem a mudança de tema via prop depois de
                // montado — forçar remount na troca de modo garante que a paleta nova aplique.
                key={modo}
                current={ensaioData ?? undefined}
                markedDates={
                  ensaioData
                    ? { [ensaioData]: { selected: true, selectedColor: colors.primary } }
                    : {}
                }
                onDayPress={(day: DateData) => setEnsaioData(day.dateString)}
                theme={{
                  backgroundColor: colors.surface,
                  calendarBackground: colors.surface,
                  textSectionTitleColor: colors.textSecondary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.textInverse,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: colors.textMuted,
                  monthTextColor: colors.text,
                  arrowColor: colors.primary,
                }}
                style={styles.calendar}
              />

              <Text style={styles.formLabel}>Horário</Text>
              <View style={styles.modalInput}>
                <EntradaHorario
                  style={styles.modalTextInput}
                  placeholder="19:00"
                  placeholderTextColor={colors.textMuted}
                  value={ensaioHora}
                  onChangeText={setEnsaioHora}
                />
              </View>

              <Text style={styles.formLabel}>Observações (opcional)</Text>
              <View style={styles.modalInput}>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Ex: levar instrumento, foco no repertório novo"
                  placeholderTextColor={colors.textMuted}
                  value={ensaioObservacoes}
                  onChangeText={setEnsaioObservacoes}
                />
              </View>
            </ScrollView>

            <Button
              title={ensaio ? 'Salvar alterações' : 'Criar ensaio'}
              onPress={handleSalvarEnsaio}
              loading={salvandoEnsaio}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setEnsaioModalAberto(false)}
              disabled={salvandoEnsaio}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={participanteEnsaioPickerAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setParticipanteEnsaioPickerAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPicker}>
            <Text style={styles.modalTitle}>Convidar pro ensaio</Text>
            {carregandoMembros ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoading} />
            ) : (
              <ScrollView style={styles.modalList}>
                {membrosParaEscolherEnsaio.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum membro disponível.</Text>
                ) : (
                  membrosParaEscolherEnsaio.map((membro) => (
                    <TouchableOpacity
                      key={membro.id}
                      style={styles.modalItem}
                      onPress={() => handleAdicionarParticipanteEnsaio(membro)}
                    >
                      <Text style={styles.modalItemText}>{membro.nome}</Text>
                      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setParticipanteEnsaioPickerAberto(false)}
              disabled={salvandoParticipanteEnsaio}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    errorText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      minWidth: 200,
    },
    scroll: {
      flex: 1,
    },
    content: {
      width: '100%',
      maxWidth: LARGURA_CONTEUDO,
      alignSelf: 'center',
      padding: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    contentWide: { maxWidth: 1120 },
    colunas: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
    colunasStack: { gap: spacing.md },
    coluna: { flex: 1, minWidth: 0, gap: spacing.sm },
    colunaStack: { gap: spacing.md },
    data: {
      ...typography.h2,
      color: colors.text,
    },
    hora: {
      ...typography.h1,
      color: colors.primary,
      marginTop: 2,
    },
    tipoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    tipo: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
    },
    sectionSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    sectionSubtitleTitulo: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    ensaioCard: {
      gap: spacing.xs,
    },
    ensaioTopo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    ensaioData: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    ensaioHora: {
      ...typography.h3,
      color: colors.primary,
    },
    ensaioObservacoes: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    formLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    calendar: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    vocalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    vocalNumero: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vocalNumeroText: {
      ...typography.caption,
      color: colors.textInverse,
      fontWeight: '700',
    },
    vocalNome: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    vocalData: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    vocalAcoes: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    adicionarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    adicionarTexto: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '600',
    },
    vocalBotoes: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    emptyText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    listCard: {
      gap: spacing.sm,
    },
    musicaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    musicaNumero: {
      ...typography.caption,
      color: colors.textMuted,
      width: 20,
    },
    musicaNome: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    musicaCapa: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
    },
    musicaCapaFallback: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tomBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      paddingHorizontal: 0,
      paddingVertical: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tomBadgeText: {
      fontSize: 14,
    },
    equipeRow: {
      gap: spacing.md,
    },
    membroAvatarBlock: {
      alignItems: 'center',
      width: 72,
      gap: 4,
    },
    membroNome: {
      ...typography.caption,
      color: colors.text,
    },
    membroFuncao: {
      ...typography.caption,
      color: colors.textMuted,
    },
    suaFuncaoCard: {
      borderColor: colors.primary,
    },
    suaFuncaoLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    suaFuncaoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 4,
    },
    suaFuncaoValor: {
      ...typography.h3,
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      gap: spacing.md,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      height: 56,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    modalTextInput: {
      ...typography.body,
      color: colors.text,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    modalPlaceholder: {
      ...typography.body,
      color: colors.textMuted,
    },
    linkDica: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: -spacing.xs,
    },
    buscaRepertorioWrap: { position: 'relative' },
    resultadosRepertorioLista: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    resultadoRepertorioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultadoRepertorioCapa: { width: 36, height: 36, borderRadius: radius.sm },
    resultadoRepertorioCapaFallback: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultadoRepertorioTextos: { flex: 1, minWidth: 0, gap: 2 },
    resultadoRepertorioTitulo: { ...typography.body, color: colors.text, fontWeight: '600' },
    resultadoRepertorioMeta: { ...typography.caption, color: colors.textMuted },
    buscaRepertorioErro: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    modalButton: {
      marginTop: spacing.xs,
    },
    modalContentPicker: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      gap: spacing.md,
      maxHeight: '70%',
    },
    modalContentEnsaio: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      gap: spacing.md,
      maxHeight: '85%',
    },
    modalLoading: {
      marginVertical: spacing.lg,
    },
    modalList: {
      maxHeight: 320,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      ...typography.body,
      color: colors.text,
    },
    modalItemSubtext: {
      ...typography.caption,
      color: colors.textMuted,
    },
    comentarioItem: {
      gap: 2,
    },
    comentarioCabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    comentarioAutor: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: '600',
    },
    comentarioHora: {
      ...typography.caption,
      color: colors.textMuted,
    },
    comentarioTexto: {
      ...typography.body,
      color: colors.textSecondary,
    },
    comentarioInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    comentarioInput: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 48,
      maxHeight: 120,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    comentarioEnviar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    comentarioEnviarOff: {
      opacity: 0.5,
    },
    historicoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    historicoDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    historicoTexto: {
      ...typography.bodySmall,
      color: colors.text,
    },
    historicoHora: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 1,
    },
    roteiroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    roteiroNum: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roteiroNumText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    roteiroTitulo: { ...typography.body, color: colors.text },
    roteiroTom: { ...typography.caption, color: colors.textSecondary },
    roteiroTag: { ...typography.caption, color: colors.textMuted },
    roteiroDuracao: { ...typography.bodySmall, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
    roteiroAcoes: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    roteiroTipoLinha: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    roteiroTipoChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roteiroTipoChipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
    roteiroTipoText: { ...typography.bodySmall, color: colors.textSecondary },
    roteiroTipoTextAtivo: { color: colors.textInverse, fontWeight: '700' },
  });
