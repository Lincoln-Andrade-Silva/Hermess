import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { enviarEmail } from "@/lib/email";
import { formatBRL } from "@/lib/format";
import { getLojaInfo, NOME_PADRAO } from "@/lib/loja";
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

async function carregar(pedidoId: string): Promise<{ pedido: DadosPedido; marca: Marca } | null> {
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

  const [itens, info] = await Promise.all([selecionarItensComImagem(pedidoId), getLojaInfo()]);

  return {
    pedido: { ...p, itens },
    marca: {
      nome: info?.nome.trim() || NOME_PADRAO,
      logoUrl: info?.logoUrl ?? null,
      emailEmpresa: info?.emailNotificacao?.trim() || null,
    },
  };
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tabelaItens(itens: ItemComImagem[], total: string): string {
  const linhas = itens
    .map((i) => {
      const combo = Object.values(i.combinacao).join(" · ");
      const thumb = i.imagem
        ? `<img src="${i.imagem}" width="44" height="56" style="border-radius:6px;object-fit:cover;object-position:top;display:block;" alt="" />`
        : "";
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;width:44px;vertical-align:top;">${thumb}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
          <strong style="color:#18181b;">${escapeHtml(i.nomeProduto)}</strong><br/>
          <span style="color:#71717a;font-size:12px;">${escapeHtml(combo)}${combo ? " · " : ""}${i.quantidade}x</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;vertical-align:top;">
          ${formatBRL(Number(i.precoUnitario) * i.quantidade)}
        </td>
      </tr>`;
    })
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#18181b;">
      ${linhas}
      <tr>
        <td colspan="2" style="padding:14px 0;font-weight:700;">Total</td>
        <td style="padding:14px 0;text-align:right;font-weight:700;">${formatBRL(total)}</td>
      </tr>
    </table>`;
}

function layout(marca: Marca, titulo: string, corpo: string): string {
  const logo = marca.logoUrl
    ? `<img src="${marca.logoUrl}" width="56" height="56" style="border-radius:50%;object-fit:cover;display:inline-block;" alt="" /><br/>`
    : "";
  return `
  <div style="background:#f4f4f5;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
      <div style="padding:24px;text-align:center;border-bottom:1px solid #f0f0f0;">
        ${logo}
        <div style="font-size:20px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#18181b;margin-top:8px;">
          ${escapeHtml(marca.nome)}
        </div>
      </div>
      <div style="padding:28px 24px;color:#18181b;">
        <h1 style="font-size:18px;margin:0 0 14px;color:#18181b;">${escapeHtml(titulo)}</h1>
        ${corpo}
      </div>
      <div style="padding:16px 24px;background:#fafafa;color:#a1a1aa;font-size:12px;text-align:center;border-top:1px solid #f0f0f0;">
        ${escapeHtml(marca.nome)} · Retirada no local
      </div>
    </div>
  </div>`;
}

function paragrafo(texto: string): string {
  return `<p style="font-size:14px;line-height:1.6;color:#3f3f46;margin:0 0 16px;">${texto}</p>`;
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
    const dados = await carregar(pedidoId);
    if (!dados) return;
    const { pedido, marca } = dados;
    const itens = tabelaItens(pedido.itens, pedido.total);

    await Promise.all([
      enviarEmail({
        to: pedido.emailCliente ?? "",
        fromName: marca.nome,
        subject: `Recebemos seu pedido #${pedido.numero}`,
        html: layout(
          marca,
          "Recebemos seu pedido!",
          paragrafo(
            `Olá, ${escapeHtml(pedido.nome)}. Recebemos seu pedido <strong>#${pedido.numero}</strong>. Assim que o pagamento for confirmado, avisaremos por aqui.`,
          ) + itens,
        ),
      }),
      enviarEmail({
        to: marca.emailEmpresa ?? "",
        fromName: marca.nome,
        subject: `Novo pedido #${pedido.numero}`,
        html: layout(
          marca,
          `Novo pedido #${pedido.numero}`,
          paragrafo(
            `${escapeHtml(pedido.nome)} fez um pedido e está aguardando pagamento.`,
          ) + itens,
        ),
      }),
    ]);
  });
}

export async function emailPedidoPago(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const dados = await carregar(pedidoId);
    if (!dados) return;
    const { pedido, marca } = dados;
    const itens = tabelaItens(pedido.itens, pedido.total);

    await Promise.all([
      enviarEmail({
        to: pedido.emailCliente ?? "",
        fromName: marca.nome,
        subject: `Pagamento confirmado — pedido #${pedido.numero}`,
        html: layout(
          marca,
          "Pagamento confirmado!",
          paragrafo(
            `Recebemos o pagamento do pedido <strong>#${pedido.numero}</strong>. Já vamos preparar para a retirada.`,
          ) + itens,
        ),
      }),
      enviarEmail({
        to: marca.emailEmpresa ?? "",
        fromName: marca.nome,
        subject: `Pedido #${pedido.numero} pago`,
        html: layout(
          marca,
          `Pedido #${pedido.numero} pago`,
          paragrafo(`O pedido de ${escapeHtml(pedido.nome)} foi pago.`) + itens,
        ),
      }),
    ]);
  });
}

export async function emailPedidoPronto(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const dados = await carregar(pedidoId);
    if (!dados) return;
    const { pedido, marca } = dados;

    await enviarEmail({
      to: pedido.emailCliente ?? "",
      fromName: marca.nome,
      subject: `Seu pedido #${pedido.numero} está pronto para retirada`,
      html: layout(
        marca,
        "Pronto para retirada!",
        paragrafo(
          `O pedido <strong>#${pedido.numero}</strong> está pronto. É só passar no local para retirar.`,
        ),
      ),
    });
  });
}

export async function emailPedidoCancelado(pedidoId: string): Promise<void> {
  await disparar(async () => {
    const dados = await carregar(pedidoId);
    if (!dados) return;
    const { pedido, marca } = dados;

    await enviarEmail({
      to: pedido.emailCliente ?? "",
      fromName: marca.nome,
      subject: `Seu pedido #${pedido.numero} foi cancelado`,
      html: layout(
        marca,
        "Pedido cancelado",
        paragrafo(
          `O pedido <strong>#${pedido.numero}</strong> foi cancelado. Se houve pagamento, o estorno foi solicitado ao Mercado Pago.`,
        ),
      ),
    });
  });
}
