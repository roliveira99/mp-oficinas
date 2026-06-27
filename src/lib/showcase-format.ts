import type { WorkshopShowcaseItem } from "@/types/workshop";
import { formatCatalogPrice } from "@/lib/workshop-storage";

export function formatShowcasePrice(value: number): string {
  return formatCatalogPrice(value);
}

export function getShowcaseDisplayLabel(item: WorkshopShowcaseItem): string | null {
  if (item.price != null && item.price > 0) {
    return formatShowcasePrice(item.price);
  }
  const label = item.label?.trim();
  return label || null;
}
