import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

/** Extrai só os dígitos e formata como DD/MM/AAAA — as barras nunca são digitadas. */
export function formatarData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** 'DD/MM/AAAA' → 'YYYY-MM-DD' (ou null se incompleto/ inválido). */
export function dataParaISO(ddmmaaaa: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(ddmmaaaa)) return null;
  const [dd, mm, aaaa] = ddmmaaaa.split('/');
  const dia = Number(dd);
  const mes = Number(mm);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return `${aaaa}-${mm}-${dd}`;
}

/** 'YYYY-MM-DD' → 'DD/MM/AAAA' (vazio se null/ inválido). */
export function isoParaData(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [aaaa, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${aaaa}`;
}

interface EntradaDataProps
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'maxLength'> {
  value: string;
  onChangeText: (v: string) => void;
}

/**
 * Campo de data (DD/MM/AAAA) mascarado — o usuário só digita números, as barras
 * aparecem sozinhas. Mesma ideia do `EntradaHorario` (HH:mm).
 */
export function EntradaData({ value, onChangeText, ...rest }: EntradaDataProps) {
  return (
    <TextInput
      {...rest}
      value={value}
      onChangeText={(t) => onChangeText(formatarData(t))}
      keyboardType="number-pad"
      maxLength={10}
    />
  );
}
