"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type Tab = "login" | "cadastro";

export function AuthPanel({
  defaultTab = "login",
  nomeLoja,
  logoUrl,
  aviso,
}: {
  defaultTab?: Tab;
  nomeLoja: string;
  logoUrl: string | null;
  aviso?: string;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="w-full">
      {/* Marca no mobile (hero fica escondido) */}
      <div className="mb-8 flex flex-col items-center text-center lg:hidden">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={nomeLoja}
            className="mb-3 h-16 w-16 rounded-full border border-line object-cover"
          />
        )}
        <span className="text-[32px] font-extrabold leading-none tracking-tight text-ink">
          {nomeLoja}
        </span>
        <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Loja Online
        </span>
      </div>

      <h2 className="text-center text-[28px] font-extrabold tracking-tight lg:text-left">
        Bem-vindo
      </h2>
      <p className="mt-1.5 text-center text-sm text-muted lg:text-left">
        Acesse sua conta ou crie uma nova.
      </p>

      {aviso && (
        <div className="mt-6 rounded-lg border border-amber-600/20 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {aviso}
        </div>
      )}

      <div className="mt-7 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
        {(["login", "cadastro"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-lg py-2.5 text-[13px] font-semibold transition",
              tab === value ? "bg-brand text-white shadow-brand" : "text-muted hover:text-ink",
            )}
          >
            {value === "login" ? "Entrar" : "Cadastrar"}
          </button>
        ))}
      </div>

      <div className="mt-7">{tab === "login" ? <LoginForm /> : <RegisterForm />}</div>
    </div>
  );
}
