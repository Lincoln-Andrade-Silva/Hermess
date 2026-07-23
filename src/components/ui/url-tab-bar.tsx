"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { montarUrl } from "@/lib/pagination";
import { TabBar, type TabItem } from "./tab-bar";

/**
 * Trocar de aba reseta paginação e busca, mais os filtros que a tela declarar
 * em `resetParams` (cada listagem tem os seus - categoria, cor, status...).
 */
export function UrlTabBar({
  tabs,
  defaultTab,
  resetParams = [],
}: {
  tabs: readonly TabItem[];
  defaultTab: string;
  resetParams?: readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? defaultTab;

  function onChange(key: string) {
    const updates: Record<string, string | null> = {
      tab: key === defaultTab ? null : key,
      page: null,
      q: null,
    };
    for (const param of resetParams) updates[param] = null;
    router.replace(montarUrl(pathname, searchParams, updates));
  }

  return <TabBar tabs={tabs} active={active} onChange={onChange} />;
}
