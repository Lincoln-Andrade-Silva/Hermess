import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let inicializado = false;

/** Transporte SMTP do Gmail. Nulo quando as credenciais não estão no ambiente. */
function getTransporter(): Transporter | null {
  if (inicializado) return transporter;
  inicializado = true;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return transporter;
}

export function emailConfigurado(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Envia um e-mail. No-op silencioso se o SMTP não estiver configurado e nunca
 * lança — notificação nenhuma pode derrubar o checkout ou a reconciliação.
 */
export async function enviarEmail(params: {
  to: string;
  subject: string;
  html: string;
  fromName: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t || !params.to) return;

  try {
    await t.sendMail({
      from: `"${params.fromName}" <${process.env.SMTP_USER}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (e) {
    console.error("Falha ao enviar e-mail:", e);
  }
}
