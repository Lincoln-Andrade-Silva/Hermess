import { Suspense } from "react";
import { getLojaBrand } from "@/lib/loja";
import { AuthPanel } from "@/features/auth/auth-panel";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const { nome, logoUrl } = await getLojaBrand();

  return (
    <Suspense fallback={null}>
      <AuthPanel defaultTab="cadastro" nomeLoja={nome} logoUrl={logoUrl} />
    </Suspense>
  );
}
