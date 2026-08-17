import { useAuth } from '@/contexts/AuthContext';
import { recursoLiberado, recursoEhPro } from '@/config/recursos';

/**
 * Resolve, na UI, se um recurso (spec 03) está liberado pra org logada e se ele é PRO.
 * Só pra UX (esconder/mostrar, selo PRO, CTA). O backend continua sendo quem barra.
 *
 * Uso:
 *   const { liberado, isPro } = useRecurso('estatisticas');
 *   if (!liberado) return <BloqueioPro />;   // ou esconder
 */
export function useRecurso(chave: string) {
  const { org } = useAuth();
  const plano = org?.plano ?? 'free';
  return {
    liberado: recursoLiberado(plano, chave),
    isPro: recursoEhPro(chave),
    plano,
  };
}
