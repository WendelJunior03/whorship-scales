import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { MainTabScreenNavigationProp } from '@/navigation/types';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { papelOrgLabel, papelOrgTone, papelOrgDe, papelMinisterioLabel, isAdmin } from '@/utils/papel';
import { SeloPro } from '@/components/SeloPro';
import { SeletorTema } from '@/components/SeletorTema';
import { useRecurso } from '@/hooks/useRecurso';
import { fonts, radius, spacing, typography } from '@/theme';
import { Cores } from '@/theme/palettes';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import appConfig from '../../../app.json';

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Informações pessoais' },
  { icon: 'notifications-outline' as const, label: 'Notificações' },
  { icon: 'shield-checkmark-outline' as const, label: 'Segurança' },
  { icon: 'help-circle-outline' as const, label: 'Ajuda e suporte' },
  { icon: 'information-circle-outline' as const, label: 'Sobre o aplicativo' },
];

// Amostra de recursos PRO (spec 03). Na v1 os liberados aparecem com selo; os de
// flag desligada (ex.: backup) aparecem como "em breve".
const RECURSOS_PRO = [
  { chave: 'offline.download', icon: 'cloud-download-outline' as const, label: 'Downloads offline' },
  { chave: 'estatisticas', icon: 'stats-chart-outline' as const, label: 'Estatísticas' },
  { chave: 'playlists', icon: 'list-outline' as const, label: 'Playlists' },
  { chave: 'backup.automatico', icon: 'save-outline' as const, label: 'Backup automático' },
];

/** Linha de recurso PRO — usa useRecurso pra decidir selo vs. "em breve". */
function RecursoProRow({
  chave,
  icon,
  label,
}: {
  chave: string;
  icon: IconName;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { liberado, isPro } = useRecurso(chave);
  return (
    <View style={styles.recursoRow}>
      <Icon name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.recursoLabel}>{label}</Text>
      {liberado ? (
        isPro && <SeloPro />
      ) : (
        <Text style={styles.recursoEmBreve}>em breve</Text>
      )}
    </View>
  );
}

export function PerfilScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(criarEstilos);
  const { user, org, signOut } = useAuth();
  const navigation = useNavigation<MainTabScreenNavigationProp<'Perfil'>>();

  const ehAdmin = user ? isAdmin(user) : false;

  async function compartilharCodigo() {
    if (!org?.codigo) return;
    try {
      await Share.share({
        message: `Entre na organização "${org.nome}" no Deep Scales com o código: ${org.codigo}`,
      });
    } catch {
      // usuário cancelou o compartilhamento — sem ação
    }
  }

  const [senhaModalAberto, setSenhaModalAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  function abrirSenhaModal() {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setSenhaModalAberto(true);
  }

  function fecharSenhaModal() {
    setSenhaModalAberto(false);
  }

  function handleMenuPress(label: (typeof MENU_ITEMS)[number]['label']) {
    switch (label) {
      case 'Informações pessoais':
        if (user) navigation.navigate('DetalheMembro', { membroId: user.id });
        return;
      case 'Notificações':
        navigation.navigate('Notificacoes');
        return;
      case 'Segurança':
        abrirSenhaModal();
        return;
      case 'Ajuda e suporte':
        Alert.alert(
          'Ajuda e suporte',
          'Precisa de ajuda? Fale com o admin do seu ministério — é quem consegue ajustar cadastros, escalas e permissões.',
        );
        return;
      case 'Sobre o aplicativo':
        Alert.alert('Sobre o aplicativo', `Deep Scales · versão ${appConfig.expo.version}`);
        return;
    }
  }

  async function handleAlterarSenha() {
    if (!user) return;

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      Alert.alert('Preencha tudo', 'Informe a senha atual e a nova senha duas vezes.');
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert('Senha muito curta', 'A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      Alert.alert('Senhas diferentes', 'A confirmação não bate com a nova senha.');
      return;
    }

    setAlterandoSenha(true);
    try {
      await membrosService.alterarSenha(user.id, { senhaAtual, novaSenha });
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.');
      fecharSenhaModal();
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível trocar a senha.');
    } finally {
      setAlterandoSenha(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
        <Icon name="create-outline" size={22} color={colors.text} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.nome?.[0] ?? '?'}</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Icon name="camera" size={16} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <Text style={styles.nome}>{user?.nome ?? '—'}</Text>
        {user && (
          <Badge
            label={papelOrgLabel[papelOrgDe(user)]}
            tone={papelOrgTone[papelOrgDe(user)]}
            style={styles.papelBadge}
          />
        )}
        {user?.papel_ministerio && (
          <Text style={styles.papelMinisterio}>{papelMinisterioLabel[user.papel_ministerio]} no ministério</Text>
        )}
        <Text style={styles.igreja}>{org?.nome ?? 'Minha igreja'}</Text>

        {ehAdmin && org?.codigo && (
          <Card style={styles.conviteCard}>
            <View style={styles.conviteInfo}>
              <Text style={styles.conviteLabel}>Código de convite</Text>
              <Text style={styles.conviteCodigo}>{org.codigo}</Text>
            </View>
            <TouchableOpacity
              style={styles.conviteBotao}
              onPress={compartilharCodigo}
              hitSlop={8}
            >
              <Icon name="share-social-outline" size={18} color={colors.primary} />
              <Text style={styles.conviteBotaoTexto}>Compartilhar</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Card style={styles.planoCard}>
          <View style={styles.planoHeader}>
            <Text style={styles.planoTitulo}>Seu plano</Text>
            <Badge
              label={org?.plano === 'pro' ? 'PRO' : 'Free'}
              tone={org?.plano === 'pro' ? 'primary' : 'neutral'}
            />
          </View>
          <Text style={styles.planoSub}>
            Tudo liberado nesta versão — os recursos PRO chegam em breve.
          </Text>
          {RECURSOS_PRO.map((r) => (
            <RecursoProRow key={r.chave} chave={r.chave} icon={r.icon} label={r.label} />
          ))}
        </Card>

        <View style={styles.temaBloco}>
          <Text style={styles.temaTitulo}>Aparência</Text>
          <SeletorTema />
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.label)}
            >
              <Icon name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Sair da conta"
          onPress={signOut}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>

      <Modal
        visible={senhaModalAberto}
        animationType="slide"
        transparent
        onRequestClose={fecharSenhaModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar senha</Text>
            <Text style={styles.modalSubtitle}>
              Se você entrou com uma senha criada pelo admin, aproveite pra trocar por uma só sua.
            </Text>

            <Input
              icon="lock-closed-outline"
              placeholder="Senha atual"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              isPassword
            />
            <Input
              icon="lock-closed-outline"
              placeholder="Nova senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              isPassword
              containerStyle={styles.modalInput}
            />
            <Input
              icon="lock-closed-outline"
              placeholder="Confirmar nova senha"
              value={confirmarNovaSenha}
              onChangeText={setConfirmarNovaSenha}
              isPassword
              containerStyle={styles.modalInput}
            />

            <Button
              title="Salvar nova senha"
              onPress={handleAlterarSenha}
              loading={alterandoSenha}
              style={styles.modalButton}
            />
            <Button
              title="Cancelar"
              variant="outline"
              onPress={fecharSenhaModal}
              disabled={alterandoSenha}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (colors: Cores) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarBlock: {
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: colors.primary,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nome: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  papelBadge: {
    alignSelf: 'center',
  },
  papelMinisterio: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  igreja: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  conviteCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  conviteInfo: {
    gap: 2,
  },
  conviteLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  conviteCodigo: {
    ...typography.h3,
    color: colors.text,
    letterSpacing: 1,
  },
  conviteBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  conviteBotaoTexto: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  planoCard: {
    width: '100%',
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  planoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planoTitulo: {
    ...typography.h3,
    color: colors.text,
  },
  planoSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  recursoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recursoLabel: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  recursoEmBreve: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  temaBloco: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  temaTitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
  },
  menu: {
    width: '100%',
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  logoutButton: {
    width: '100%',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
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
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  modalInput: {
    marginTop: 0,
  },
  modalButton: {
    marginTop: spacing.xs,
  },
});
