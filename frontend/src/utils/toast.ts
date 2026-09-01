export type ToastTipo = 'success' | 'error' | 'info';

/** Requisição entregue ao <ToastHost/> que renderiza o toast. */
export interface ToastRequest {
  mensagem: string;
  tipo: ToastTipo;
  /** Tempo em tela (ms) antes de sumir sozinho. */
  duracao: number;
}

// Mesmo padrão do confirm.ts: o host montado no root registra o handler.
// Diferente do ConfirmDialog, um toast é não-crítico — se o host ainda não
// estiver montado, a mensagem simplesmente não aparece (sem fallback a Alert).
let handler: ((req: ToastRequest) => void) | null = null;

export function setToastHandler(fn: ((req: ToastRequest) => void) | null) {
  handler = fn;
}

/** Feedback rápido e efêmero (sucesso/erro/info). Não bloqueia a tela. */
export function showToast(mensagem: string, tipo: ToastTipo = 'info', duracao = 3000) {
  handler?.({ mensagem, tipo, duracao });
}
