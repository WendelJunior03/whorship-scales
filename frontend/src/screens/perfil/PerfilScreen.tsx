import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import * as membrosService from '@/services/membros';
import { ApiError } from '@/services/api';
import { papelLabel, papelTone } from '@/utils/papel';
import { colors, spacing, typography } from '@/theme';

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Informações pessoais' },
  { icon: 'notifications-outline' as const, label: 'Notificações' },
  { icon: 'shield-checkmark-outline' as const, label: 'Segurança' },
  { icon: 'help-circle-outline' as const, label: 'Ajuda e suporte' },
  { icon: 'information-circle-outline' as const, label: 'Sobre o aplicativo' },
];

export function PerfilScreen() {
  const { user, signOut } = useAuth();

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
        <Ionicons name="create-outline" size={22} color={colors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.nome?.[0] ?? '?'}</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={16} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <Text style={styles.nome}>{user?.nome ?? '—'}</Text>
        {user && <Badge label={papelLabel[user.papel]} tone={papelTone[user.papel]} />}
        <Text style={styles.igreja}>Igreja Central</Text>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.label === 'Segurança' ? abrirSenhaModal : undefined}
            >
              <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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

const styles = StyleSheet.create({
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
  igreja: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
