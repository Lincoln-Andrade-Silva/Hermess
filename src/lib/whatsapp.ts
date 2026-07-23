/** Monta o link do WhatsApp a partir do telefone (adiciona DDI 55 quando ausente). */
export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const comDdi = digitos.length <= 11 ? `55${digitos}` : digitos;
  const base = `https://wa.me/${comDdi}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}
