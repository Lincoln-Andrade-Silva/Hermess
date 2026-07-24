import { listarBanners } from "@/features/banner/actions";
import { BannersClient } from "@/features/banner/banners-client";

export const dynamic = "force-dynamic";

export default async function BannerPage() {
  const banners = await listarBanners();
  return <BannersClient banners={banners} />;
}
