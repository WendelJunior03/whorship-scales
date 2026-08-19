import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SeloPro } from '@/components/SeloPro';
import { useOctapadAparencia } from '@/hooks/useOctapadAparencia';
import { useRecurso } from '@/hooks/useRecurso';
import { KIT_PADRAO } from '@/audio/kits';
import { getAudioContext } from '@/audio/audioContext';
import { BIBLIOTECA_DRUMS, CATEGORIAS_BIBLIOTECA_DRUMS, SomBiblioteca } from '@/audio/bibliotecaDrums';
import type { MainStackParamList } from '@/navigation/MainNavigator';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';

type Nav = StackNavigationProp<MainStackParamList, 'BibliotecaDrums'>;

/** Biblioteca de Drums (recurso PRO `pads.pack_premium`) — escolhe um som pronto pra um pad do Octapad. */
export function BibliotecaDrumsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const navigation = useNavigation<Nav>();
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
    // Som + nome numa chamada só (ver comentário em definirSomPad — evita perder o nome
    // numa corrida entre a gravação e o goBack recarregando a tela anterior).
    definirSomPad(padId, item ? item.id : null, item ? item.nome : null);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Biblioteca de Drums" subtitle={`Escolher som — ${nomePad}`} showBack />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsLinha}
        style={styles.chipsScroll}
      >
        {KIT_PADRAO.map((p) => {
          const nome = aparencia.nomesPads[p.id] ?? p.nome;
          const ativo = p.id === padId;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPadId(p.id)}
              style={[styles.chip, ativo && styles.chipAtivo]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{nome}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.aviso}>
          <SeloPro />
          <Text style={styles.avisoTexto}>
            {liberado
              ? 'Escolha um som pronto da biblioteca pra este pad, no lugar do som sintetizado padrão.'
              : 'Recurso disponível no plano PRO.'}
          </Text>
        </View>

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
                  <TouchableOpacity onPress={() => tocarPreview(item)} hitSlop={8} style={styles.previewBotao}>
                    <Icon name={tocando ? 'stop' : 'play'} size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.itemNome}>{item.nome}</Text>
                  <TouchableOpacity onPress={() => usar(item)} hitSlop={8}>
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
  chipsScroll: { flexGrow: 0 },
  chipsLinha: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextoAtivo: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
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
