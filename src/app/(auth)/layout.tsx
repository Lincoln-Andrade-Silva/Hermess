import { getLojaBrand } from "@/lib/loja";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Catálogo com variações de cor e tamanho",
  "Pagamento por Pix, crédito ou débito",
  "Acompanhe seus pedidos até a retirada",
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { nome: nomeLoja, logoUrl } = await getLojaBrand();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero: visivel apenas em telas grandes */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface p-12 lg:flex xl:p-14">
        <div className="relative flex items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={nomeLoja}
              className="h-11 w-11 rounded-full border border-line object-cover"
            />
          )}
          <span className="text-[26px] font-extrabold tracking-tight text-ink">{nomeLoja}</span>
        </div>

        <div className="relative">
          <span className="mb-7 inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
            Loja Online
          </span>
          <h1 className="mb-4 text-[50px] font-extrabold leading-[1.1] tracking-tight text-ink">
            Sua loja,
            <br />
            do carrinho ao caixa.
          </h1>
          <p className="max-w-[360px] text-[15px] leading-[1.8] text-muted">
            Catálogo, pagamento e estoque em um só lugar. Para clientes e para quem administra.
          </p>
        </div>

        <ul className="relative flex flex-col gap-3.5">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-[13px] text-muted">
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border border-line2 bg-bg text-[10px] text-ink">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </aside>

      {/* Card de autenticacao */}
      <main className="flex items-center justify-center bg-bg px-6 py-10 sm:px-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
