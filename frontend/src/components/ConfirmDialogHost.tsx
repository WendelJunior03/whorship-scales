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

  return (
    <ConfirmDialog
      visible={!!req}
      titulo={req?.titulo ?? ''}
      mensagem={req?.mensagem ?? ''}
      confirmLabel={req?.confirmLabel}
      cancelLabel={req?.cancelLabel}
      onConfirm={() => {
        const r = req;
        fechar();
        r?.onConfirm?.();
      }}
      onCancel={
        soAviso
          ? undefined
          : () => {
              const r = req;
              fechar();
              r?.onCancel?.();
            }
      }
    />
  );
}
