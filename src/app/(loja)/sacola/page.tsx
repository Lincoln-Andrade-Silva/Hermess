import type { Metadata } from "next";
import { getProfileOpcional } from "@/lib/auth";
import { SacolaClient } from "@/features/sacola/sacola-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sacola" };

export default async function SacolaPage() {
  const profile = await getProfileOpcional();
  const cliente = profile
    ? { nome: profile.nome, telefone: profile.telefone ?? "", email: profile.email }
    : null;

  return <SacolaClient cliente={cliente} />;
}
