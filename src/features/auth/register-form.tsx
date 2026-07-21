"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Field, FormError, Input } from "@/components/ui";
import { maskTelefone } from "@/lib/mask";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const params = useSearchParams();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone, senha }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setErro(body?.error ?? "Não foi possível registrar.");
      setCarregando(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro("Conta criada, mas o login falhou. Tente entrar manualmente.");
      setCarregando(false);
      return;
    }

    // Quem veio do checkout volta pra lá; o resto cai na vitrine.
    window.location.href = params.get("redirect") || "/";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nome completo" htmlFor="cad-nome">
        <Input
          id="cad-nome"
          required
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </Field>

      <Field label="Email" htmlFor="cad-email">
        <Input
          id="cad-email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="WhatsApp / Telefone" htmlFor="cad-telefone">
        <Input
          id="cad-telefone"
          type="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={telefone}
          onChange={(e) => setTelefone(maskTelefone(e.target.value))}
        />
      </Field>

      <Field label="Senha" htmlFor="cad-senha" hint="(mín. 6 caracteres)">
        <Input
          id="cad-senha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </Field>

      {erro && <FormError>{erro}</FormError>}

      <Button type="submit" disabled={carregando} className="w-full">
        {carregando ? "Criando conta..." : "Criar conta gratuita"}
      </Button>
    </form>
  );
}
