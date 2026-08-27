import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SeloPro } from '@/components/SeloPro';
import { useOctapadAparencia } from '@/hooks/useOctapadAparencia';
import { useRecurso } from '@/hooks/useRecurso';
import { KIT_PADRAO } from '@/audio/kits';
import { getAudioContext } from '@/audio/audioContext';
import { BIBLIOTECA_DRUMS, CATEGORIAS_BIBLIOTECA_DRUMS, SomBiblioteca } from '@/audio/bibliotecaDrums';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { fonts, LARGURA_CONTEUDO, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

// Mesma cor de "borracha" do Octapad de verdade (spec 05), só em miniatura e lisa —
// aqui é seletor de instrumento, não toca nada, então sem textura/estado pressionado.
const MINI_BORRACHA = '#20242C';

interface MiniOctapadProps {
  nome: string;
  cor: string;
  selecionado: boolean;
  onPress: () => void;
}

/** Mini réplica visual de um pad do Octapad — aqui é só atalho pra saber qual instrumento você está editando. */
function MiniOctapad({ nome, cor, selecionado, onPress }: MiniOctapadProps) {
  const styles = useThemedStyles(criarEstilos);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.miniColuna}>
      <View style={[styles.miniPad, selecionado && { borderColor: cor }]}>
        <View style={[styles.miniLed, selecionado && { backgroundColor: cor, shadowColor: cor }]} />
      </View>
      <Text style={[styles.miniNome, selecionado && { color: cor }]} numberOfLines={1}>
        {nome}
      </Text>
    </TouchableOpacity>
  );
}

/** Biblioteca de Drums (recurso PRO `pads.pack_premium`) — escolhe um som pronto pra um pad do Octapad. */
export function BibliotecaDrumsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const route = useRoute<RouteProp<MainStackParamList, 'BibliotecaDrums'>>();

  const { aparencia, definirSomPad } = useOctapadAparencia();
  const { liberado } = useRecurso('pads.pack_premium');

  // Sem instrumento pré-selecionado (atalho genérico da tela do Octapad) começa no
  // primeiro do kit; dá pra trocar pelos chips abaixo do cabeçalho.
  const [padId, setPadId] = useState(route.params?.padId ?? KIT_PADRAO[0].id);

  const pad = KIT_PADRAO.find((p) => p.id === padId);
  const nomePad = (pad && aparencia.nomesPads[pad.id]) ?? pad?.nome ?? '';
  const somAtualId = aparencia.somPads[padId] ?? null;

  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const [tocandoId, setTocandoId] = useState<string | null>(null);

  async function tocarPreview(item: SomBiblioteca) {
    const ctx = getAudioContext();
    let buffer = bufferCacheRef.current.get(item.id);
    if (!buffer) {
      const resposta = await fetch(`/drums/${item.arquivo}`);
      const dados = await resposta.arrayBuffer();
      buffer = await ctx.decodeAudioData(dados);
      bufferCacheRef.current.set(item.id, buffer);
    }
    const fonte = ctx.createBufferSource();
    fonte.buffer = buffer;
    fonte.connect(ctx.destination);
    fonte.onended = () => setTocandoId((atual) => (atual === item.id ? null : atual));
    fonte.start(0);
    setTocandoId(item.id);
  }

  function usar(item: SomBiblioteca | null) {
    // Não volta pro Octapad sozinho — o usuário pode querer escolher som pra vários pads
    // seguidos (trocando pela grade aí em cima) antes de voltar manualmente.
    definirSomPad(padId, item ? item.id : null, item ? item.nome : null);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Biblioteca de Drums" showBack />
      <Card style={styles.gradeCard}>
        <Text style={styles.gradeTitulo}>{`Escolher som — ${nomePad}`}</Text>
        <View style={styles.grade}>
          {KIT_PADRAO.map((p) => (
            <MiniOctapad
              key={p.id}
              cor={aparencia.coresPads[p.id] ?? p.cor}
              nome={aparencia.nomesPads[p.id] ?? p.nome}
              selecionado={p.id === padId}
              onPress={() => setPadId(p.id)}
            />
          ))}
        </View>
      </Card>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.aviso}>
          <SeloPro />
          <Text style={styles.avisoTexto}>
            {liberado
              ? 'Escolha um som pronto da biblioteca pra este pad, no lugar do som sintetizado padrão.'
              : 'Recurso disponível no plano PRO.'}
          </Text>
        </Card>

        <TouchableOpacity
          style={[styles.item, somAtualId === null && styles.itemSelecionado]}
          onPress={() => usar(null)}
          activeOpacity={0.8}
        >
          <Text style={styles.itemNome}>Som padrão do kit</Text>
          {somAtualId === null && <Icon name="checkmark-circle" size={20} color={colors.primary} />}
        </TouchableOpacity>

        {CATEGORIAS_BIBLIOTECA_DRUMS.map((categoria) => (
          <View key={categoria} style={styles.categoriaBloco}>
            <Text style={styles.categoriaTitulo}>{categoria}</Text>
            {BIBLIOTECA_DRUMS.filter((s) => s.categoria === categoria).map((item) => {
              const selecionado = somAtualId === item.id;
              const tocando = tocandoId === item.id;
              return (
                <View key={item.id} style={[styles.item, selecionado && styles.itemSelecionado]}>
                  <TouchableOpacity
                    onPress={() => tocarPreview(item)}
                    hitSlop={8}
                    style={styles.previewBotao}
                    accessibilityRole="button"
                    accessibilityLabel={tocando ? `Parar prévia de ${item.nome}` : `Tocar prévia de ${item.nome}`}
                  >
                    <Icon name={tocando ? 'stop' : 'play'} size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.itemNome}>{item.nome}</Text>
                  <TouchableOpacity
                    onPress={() => usar(item)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={selecionado ? `${item.nome} selecionado` : `Usar ${item.nome}`}
                  >
                    {selecionado ? (
                      <Icon name="checkmark-circle" size={20} color={colors.primary} />
                    ) : (
                      <Text style={styles.usarTexto}>Usar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // Painel atrás da grade (mesmo Card usado no resto do app) pra não parecer que os
  // pads estão flutuando soltos na tela.
  gradeCard: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  gradeTitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  // 4 colunas fixas (largura do item + gap), centralizada no painel — 8 pads viram 2
  // fileiras de 4 em vez de uma fileira só, então cabem confortavelmente em qualquer largura.
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 64 * 4 + spacing.md * 3,
    gap: spacing.md,
  },
  miniColuna: {
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  miniPad: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: MINI_BORRACHA,
    borderWidth: 2,
    borderColor: '#05070A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLed: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D0F13',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  miniNome: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  content: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  avisoTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  categoriaBloco: { gap: spacing.xs },
  categoriaTitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    marginTop: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemSelecionado: {
    borderColor: colors.primary,
  },
  previewBotao: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNome: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  usarTexto: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
});
