import { listarCategorias } from "@/features/categorias/actions";
import { CategoriasClient } from "@/features/categorias/categorias-client";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await listarCategorias();
  return <CategoriasClient categorias={categorias} />;
}
