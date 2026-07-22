import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { enviarEmail } from "@/lib/email";
import { formatBRL } from "@/lib/format";
import { getLojaInfo, NOME_PADRAO } from "@/lib/loja";
import { getBaseUrl } from "@/lib/pagamento";
import { selecionarItensComImagem, type ItemComImagem } from "./itens";

interface DadosPedido {
  numero: number;
  nome: string;
  emailCliente: string | null;
  total: string;
  itens: ItemComImagem[];
}

interface Marca {
  nome: string;
  logoUrl: string | null;
  emailEmpresa: string | null;
}

interface Contexto {
  pedido: DadosPedido;
  marca: Marca;
  baseUrl: string | null;
}

async function carregar(pedidoId: string): Promise<Contexto | null> {
  const [p] = await db
    .select({
      numero: pedidos.numero,
      nome: pedidos.nome,
      emailCliente: pedidos.email,
      total: pedidos.total,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId));
  if (!p) return null;

  const [itens, info, baseUrl] = await Promise.all([
    selecionarItensComImagem(pedidoId),
    getLojaInfo(),
    getBaseUrl().catch(() => null),
  ]);

  return {
    pedido: { ...p, itens },
    marca: {
      nome: info?.nome.trim() || NOME_PADRAO,
      logoUrl: info?.logoUrl ?? null,
      emailEmpresa: info?.emailNotificacao?.trim() || null,
    },
    baseUrl,
  };
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INK = "#0a0a0a";
const MUTED = "#6b7280";
const LINE = "#eeeeee";

/** Tabela de itens com miniatura e o total destacado. */
function tabelaItens(itens: ItemComImagem[], total: string): string {
  const linhas = itens
    .map((i) => {
      const combo = Object.values(i.combinacao).join(" · ");
      const thumb = i.imagem
        ? `<img src="${i.imagem}" width="48" height="60" style="border-radius:8px;object-fit:cover;object-position:top;display:block;border:1px solid ${LINE};" alt="" />`
        : `<div style="width:48px;height:60px;border-radius:8px;background:#f4f4f5;"></div>`;
      return `
      <tr>
        <td width="48" style="padding:12px 0;vertical-align:middle;">${thumb}</td>
        <td style="padding:12px 14px;vertical-align:middle;">
          <div style="font-size:14px;font-weight:600;color:${INK};line-height:1.3;">${escapeHtml(i.nomeProduto)}</div>
          <div style="font-size:12px;color:${MUTED};margin-top:3px;">${escapeHtml(combo)}${combo ? " · " : ""}${i.quantidade}x</div>
        </td>
        <td align="right" style="padding:12px 0;vertical-align:middle;font-size:14px;font-weight:600;color:${INK};white-space:nowrap;">
          ${formatBRL(Number(i.precoUnitario) * i.quantidade)}
        </td>
      </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">
      ${linhas}
      <tr>
        <td colspan="2" style="padding:16px 0 0;border-top:2px solid ${INK};font-size:15px;font-weight:800;color:${INK};">Total</td>
        <td align="right" style="padding:16px 0 0;border-top:2px solid ${INK};font-size:15px;font-weight:800;color:${INK};white-space:nowrap;">${formatBRL(total)}</td>
      </tr>
    </table>`;
}

/** Botão de ação (dark). */
function botao(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 2px;">
      <tr>
        <td style="border-radius:10px;background:${INK};">
          <a href="${href}" style="display:inline-block;padding:13px 30px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.4px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function layout(
  marca: Marca,
  opts: { titulo: string; intro: string; corpo?: string; cta?: string },
): string {
  const logo = marca.logoUrl
    ? `<img src="${marca.logoUrl}" width="64" height="64" style="border-radius:50%;object-fit:cover;display:block;margin:0 auto 14px;border:2px solid rgba(255,255,255,0.25);" alt="" />`
    : "";

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background:${INK};padding:34px 24px;text-align:center;">
              ${logo}
              <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                ${escapeHtml(marca.nome)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 30px;">
              <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;color:${INK};">${escapeHtml(opts.titulo)}</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#52525b;">${opts.intro}</p>
              ${opts.corpo ?? ""}
              ${opts.cta ?? ""}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 24px;background:#fafafa;border-top:1px solid ${LINE};text-align:center;">
              <div style="font-size:13px;font-weight:700;color:${INK};letter-spacing:1px;text-transform:uppercase;">${escapeHtml(marca.nome)}</div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">Retirada no local · e-mail automático</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

/** Executa um disparo protegido — nenhuma falha de e-mail afeta a operação. */
async function disparar(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error("Falha na notificação por e-mail:", e);
  }
}

export async function emailPedidoCriado(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const ctx = await carregar(pedidoId);
    if (!ctx) return;
    const { pedido, marca, baseUrl } = ctx;
    const itens = tabelaItens(pedido.itens, pedido.total);

    await Promise.all([
      enviarEmail({
        to: pedido.emailCliente ?? "",
        fromName: marca.nome,
        subject: `Recebemos seu pedido #${pedido.numero}`,
        html: layout(marca, {
          titulo: `Recebemos seu pedido, ${escapeHtml(pedido.nome.split(" ")[0])}!`,
          intro: `Seu pedido <strong>#${pedido.numero}</strong> foi registrado. Assim que o pagamento for confirmado, avisamos por aqui.`,
          corpo: itens,
          cta: baseUrl ? botao(`${baseUrl}/pedido/${pedido.numero}`, "Ver meu pedido") : undefined,
        }),
      }),
      enviarEmail({
        to: marca.emailEmpresa ?? "",
        fromName: marca.nome,
        subject: `Novo pedido #${pedido.numero}`,
        html: layout(marca, {
          titulo: `Novo pedido #${pedido.numero}`,
          intro: `${escapeHtml(pedido.nome)} fez um pedido e está aguardando pagamento.`,
          corpo: itens,
          cta: baseUrl
            ? botao(`${baseUrl}/admin/pedidos/${pedido.numero}`, "Abrir no painel")
            : undefined,
        }),
      }),
    ]);
  });
}

export async function emailPedidoPago(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const ctx = await carregar(pedidoId);
    if (!ctx) return;
    const { pedido, marca, baseUrl } = ctx;
    const itens = tabelaItens(pedido.itens, pedido.total);

    await Promise.all([
      enviarEmail({
        to: pedido.emailCliente ?? "",
        fromName: marca.nome,
        subject: `Pagamento confirmado — pedido #${pedido.numero}`,
        html: layout(marca, {
          titulo: "Pagamento confirmado!",
          intro: `Recebemos o pagamento do pedido <strong>#${pedido.numero}</strong>. Já vamos preparar tudo para a retirada.`,
          corpo: itens,
          cta: baseUrl ? botao(`${baseUrl}/pedido/${pedido.numero}`, "Ver meu pedido") : undefined,
        }),
      }),
      enviarEmail({
        to: marca.emailEmpresa ?? "",
        fromName: marca.nome,
        subject: `Pedido #${pedido.numero} pago`,
        html: layout(marca, {
          titulo: `Pedido #${pedido.numero} pago`,
          intro: `O pedido de ${escapeHtml(pedido.nome)} foi pago e está pronto para separação.`,
          corpo: itens,
          cta: baseUrl
            ? botao(`${baseUrl}/admin/pedidos/${pedido.numero}`, "Abrir no painel")
            : undefined,
        }),
      }),
    ]);
  });
}

export async function emailPedidoPronto(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const ctx = await carregar(pedidoId);
    if (!ctx) return;
    const { pedido, marca, baseUrl } = ctx;

    await enviarEmail({
      to: pedido.emailCliente ?? "",
      fromName: marca.nome,
      subject: `Seu pedido #${pedido.numero} está pronto para retirada`,
      html: layout(marca, {
        titulo: "Pronto para retirada!",
        intro: `O pedido <strong>#${pedido.numero}</strong> está pronto. É só passar no local para retirar.`,
        cta: baseUrl ? botao(`${baseUrl}/pedido/${pedido.numero}`, "Ver meu pedido") : undefined,
      }),
    });
  });
}

export async function emailPedidoCancelado(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const ctx = await carregar(pedidoId);
    if (!ctx) return;
    const { pedido, marca } = ctx;

    await enviarEmail({
      to: pedido.emailCliente ?? "",
      fromName: marca.nome,
      subject: `Seu pedido #${pedido.numero} foi cancelado`,
      html: layout(marca, {
        titulo: "Pedido cancelado",
        intro: `O pedido <strong>#${pedido.numero}</strong> foi cancelado. Se houve pagamento, o estorno já foi solicitado ao Mercado Pago e cai na fatura em alguns dias.`,
      }),
    });
  });
}
