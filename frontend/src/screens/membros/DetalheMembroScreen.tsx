import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { colors, spacing, typography } from '@/theme';

export function DetalheMembroScreen() {
  const route = useRoute();
  const { membroId } = (route.params ?? {}) as { membroId?: number };
  const isNovo = !membroId;

  // Dados de exemplo, so pra mostrar a estrutura — a busca/gravacao real
  // do membro entra num proximo prompt.
  const [nome, setNome] = useState(isNovo ? '' : 'Pedro Henrique');
  const [email, setEmail] = useState(isNovo ? '' : 'pedro.henrique@example.com');
  const [telefone, setTelefone] = useState(isNovo ? '' : '34999999999');
  const [instrumento, setInstrumento] = useState(isNovo ? '' : 'Guitarra');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title={isNovo ? 'Novo Membro' : 'Editar Membro'} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nome ? nome[0] : '+'}</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={16} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            icon="person-outline"
            placeholder="Nome completo"
            value={nome}
            onChangeText={setNome}
          />
          <Input
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            icon="call-outline"
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
          <Input
            icon="musical-notes-outline"
            placeholder="Instrumento"
            value={instrumento}
            onChangeText={setInstrumento}
          />
        </View>

        <Button title="Salvar" onPress={() => {}} style={styles.saveButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  avatarBlock: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
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
  form: {
    gap: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});
