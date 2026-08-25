import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/** Requisição entregue ao host que renderiza o diálogo bonito. */
export interface ConfirmRequest {
  titulo: string;
  mensagem: string;
  confirmLabel?: string;
  /** null → aviso (um botão só). */
  cancelLabel?: string | null;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Registrado pelo <ConfirmDialogHost/> (montado no root, dentro do ThemeProvider).
// Com ele, confirmAction/notifyAction usam o mesmo diálogo bonito em todo o app,
// sem cada tela precisar renderizar o seu. Mesmo padrão do setUnauthorizedHandler.
let handler: ((req: ConfirmRequest) => void) | null = null;

export function setConfirmHandler(fn: ((req: ConfirmRequest) => void) | null) {
  handler = fn;
}

/** Confirmação (dois botões). */
export function confirmAction(options: ConfirmOptions, onConfirm: () => void) {
  const { title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = true } = options;

  if (handler) {
    handler({ titulo: title, mensagem: message, confirmLabel, cancelLabel, onConfirm });
    return;
  }

  // Fallback (host ainda não montado): comportamento antigo.
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** Aviso (um botão) — mesmo diálogo bonito, para feedback de sucesso/erro. */
export function notifyAction(titulo: string, mensagem: string, confirmLabel = 'OK') {
  if (handler) {
    handler({ titulo, mensagem, confirmLabel, cancelLabel: null });
    return;
  }

  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }

  Alert.alert(titulo, mensagem);
}
