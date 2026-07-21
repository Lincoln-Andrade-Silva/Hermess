import { Suspense } from "react";
import { getLojaBrand } from "@/lib/loja";
import { AuthPanel } from "@/features/auth/auth-panel";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { erro?: string } }) {
  const { nome, logoUrl } = await getLojaBrand();
  const aviso =
    searchParams.erro === "inativo" ? "Seu acesso está inativo. Fale com a loja." : undefined;

  return (
    <Suspense fallback={null}>
      <AuthPanel defaultTab="login" nomeLoja={nome} logoUrl={logoUrl} aviso={aviso} />
    </Suspense>
  );
}
