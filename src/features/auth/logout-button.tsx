"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ fullWidth = true }: { fullWidth?: boolean }) {
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // A vitrine é pública, então sair devolve pra home e não pro login.
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-transparent px-3 py-2 text-xs font-medium text-muted transition hover:border-red-400 hover:text-red-400 disabled:opacity-60",
        fullWidth && "w-full",
      )}
    >
      <LogOut className="h-4 w-4" />
      {saindo ? "Saindo..." : "Sair da conta"}
    </button>
  );
}
