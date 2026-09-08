import React, { useEffect, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfirmRequest, setConfirmHandler } from '@/utils/confirm';

/**
 * Host único, montado no root, que renderiza o ConfirmDialog para qualquer
 * chamada de confirmAction/notifyAction no app. Assim os diálogos ficam
 * padronizados (o mesmo visual) sem cada tela ter o seu.
 */
export function ConfirmDialogHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    setConfirmHandler((r) => setReq(r));
    return () => setConfirmHandler(null);
  }, []);

  const fechar = () => setReq(null);
  const soAviso = !req || req.cancelLabel === null;

  // Só renderiza o <Modal> (e o portal dele) quando existe um pedido de verdade
  // — em vez de sempre montado com `visible` alternando. No react-native-web o
  // Modal cria o portal no <body> assim que MONTA (não só quando fica visível);
  // como este host vive na raiz do app, seu portal nasceria antes de qualquer
  // modal de tela e ficaria atrás dele (quem monta depois desenha por cima).
  // Montando o Modal só na hora do pedido, ele sempre nasce DEPOIS de qualquer
  // modal de tela que já esteja aberto — fica por cima sem depender de z-index.
  if (!req) return null;

  return (
    <ConfirmDialog
      visible
      titulo={req.titulo}
      mensagem={req.mensagem}
      confirmLabel={req.confirmLabel}
      cancelLabel={req.cancelLabel}
      onConfirm={() => {
        const r = req;
        fechar();
        r.onConfirm?.();
      }}
      onCancel={
        soAviso
          ? undefined
          : () => {
              const r = req;
              fechar();
              r.onCancel?.();
            }
      }
    />
  );
}
