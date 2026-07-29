import { Resend } from 'resend';

export async function enviarEmail(destinatario: string, assunto: string, corpo: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: destinatario,
    subject: assunto,
    html: corpo,
    });
}