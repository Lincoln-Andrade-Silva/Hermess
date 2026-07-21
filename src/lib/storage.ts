import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

export const BUCKET = "loja";

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

function clienteStorage() {
  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) throw new Error("Storage não configurado.");

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Faz upload de uma imagem via service_role e devolve a URL pública.
 * Server-only. Valida tipo e tamanho aqui porque este é o ponto onde o
 * arquivo entra no sistema — a borda.
 */
export async function uploadImagem(file: File, pasta: string): Promise<string> {
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error("Formato inválido. Use PNG, JPEG, WebP ou AVIF.");
  }
  if (file.size > TAMANHO_MAXIMO) {
    throw new Error("Imagem acima de 5MB.");
  }

  const supabase = clienteStorage();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const sufixo = Math.random().toString(36).slice(2, 8);
  const path = `${pasta}/${Date.now()}-${sufixo}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Remove a imagem do bucket a partir da URL pública. Falha em silêncio:
 * um arquivo órfão no storage não deve impedir a exclusão do produto.
 */
export async function removerImagem(url: string): Promise<void> {
  const marcador = `/storage/v1/object/public/${BUCKET}/`;
  const path = url.split(marcador)[1];
  if (!path) return;

  await clienteStorage()
    .storage.from(BUCKET)
    .remove([path])
    .catch(() => undefined);
}
