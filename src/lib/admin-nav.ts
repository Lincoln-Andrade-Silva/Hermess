import {
  BarChart3,
  Boxes,
  Gauge,
  Image,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ready?: boolean;
}

export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
}

// Menu lateral do admin, dividido por categorias. `ready` marca o que já existe:
// o que ainda não foi implementado aparece desabilitado como "em breve".
export const ADMIN_NAV: AdminNavSection[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Dashboard", href: "/admin", icon: Gauge, ready: true },
      { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3, ready: false },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Pedidos", href: "/admin/pedidos", icon: Receipt, ready: false },
      { label: "PDV", href: "/admin/pdv", icon: ShoppingCart, ready: false },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Produtos", href: "/admin/produtos", icon: Package, ready: true },
      { label: "Categorias", href: "/admin/categorias", icon: Tags, ready: true },
      { label: "Estoque", href: "/admin/estoque", icon: Boxes, ready: false },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Aparência", href: "/admin/aparencia", icon: Image, ready: true },
      { label: "Configurações", href: "/admin/configuracoes", icon: Settings, ready: true },
    ],
  },
];
