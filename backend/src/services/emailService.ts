import { Resend } from 'resend';

export async function enviarEmail(destinatario: string, assunto: string, corpo: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // O SDK do Resend NÃO lança exceção em erro da API (ex: domínio de teste
    // só entrega pro e-mail dono da conta, quota excedida, chave inválida) —
    // ele resolve normalmente com `{ data: null, error: {...} }`. Sem checar
    // isso, o e-mail "falha" em silêncio: nenhum try/catch de quem chama esta
    // função nunca dispara, e o log de erro nunca aparece.
    const { error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: destinatario,
        subject: assunto,
        html: corpo,
    });

    if (error) {
        throw new Error(`Resend: ${error.name} — ${error.message}`);
    }
}