import { listarBanners } from "@/features/aparencia/actions";
import { AparenciaClient } from "@/features/aparencia/aparencia-client";

export const dynamic = "force-dynamic";

export default async function AparenciaPage() {
  const banners = await listarBanners();
  return <AparenciaClient banners={banners} />;
}
