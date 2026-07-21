"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Field, FormError, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("Email ou senha inválidos.");
      setCarregando(false);
      return;
    }

    // Navegacao completa para o middleware enxergar a sessao nos cookies.
    window.location.href = params.get("redirect") || "/";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Senha" htmlFor="login-senha">
        <Input
          id="login-senha"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </Field>

      {erro && <FormError>{erro}</FormError>}

      <Button type="submit" disabled={carregando} className="w-full">
        {carregando ? "Entrando..." : "Entrar na conta"}
      </Button>
    </form>
  );
}
