export interface BorrowingItemInput {
  inventaris_id: string;
  jumlah_pinjam: number;
}

export interface BorrowingItemSummary {
  id?: string;
  peminjaman_id?: string;
  inventaris_id: string;
  inventaris_nama: string;
  inventaris_kode: string;
  jumlah_pinjam: number;
  laboratorium_nama?: string;
}

export interface BorrowingSummarySnapshot {
  item_count: number;
  total_quantity: number;
  inventaris_nama: string;
  inventaris_kode: string;
  item_summary: string;
}

export function normalizeBorrowingItems(
  items: BorrowingItemInput[],
): BorrowingItemInput[] {
  const merged = new Map<string, number>();

  items.forEach((item) => {
    if (!item?.inventaris_id) return;
    const qty = Number(item.jumlah_pinjam || 0);
    if (!Number.isFinite(qty) || qty <= 0) return;
    merged.set(item.inventaris_id, (merged.get(item.inventaris_id) || 0) + qty);
  });

  return Array.from(merged.entries()).map(([inventaris_id, jumlah_pinjam]) => ({
    inventaris_id,
    jumlah_pinjam,
  }));
}

export function buildFallbackBorrowingItems(
  fallback?: {
    inventaris_id?: string | null;
    jumlah_pinjam?: number | null;
    inventaris_nama?: string | null;
    inventaris_kode?: string | null;
    laboratorium_nama?: string | null;
  } | null,
): BorrowingItemSummary[] {
  if (!fallback?.inventaris_id) {
    return [];
  }

  return [
    {
      inventaris_id: fallback.inventaris_id,
      inventaris_nama: fallback.inventaris_nama || "Unknown",
      inventaris_kode: fallback.inventaris_kode || "-",
      jumlah_pinjam: fallback.jumlah_pinjam || 0,
      laboratorium_nama: fallback.laboratorium_nama || "-",
    },
  ];
}

export function summarizeBorrowingItems(
  items: BorrowingItemSummary[],
): BorrowingSummarySnapshot {
  if (!items.length) {
    return {
      item_count: 0,
      total_quantity: 0,
      inventaris_nama: "Unknown",
      inventaris_kode: "-",
      item_summary: "-",
    };
  }

  const totalQuantity = items.reduce(
    (sum, item) => sum + (Number(item.jumlah_pinjam) || 0),
    0,
  );
  const first = items[0];
  const inventarisNama =
    items.length === 1
      ? first.inventaris_nama
      : `${first.inventaris_nama} +${items.length - 1} alat lain`;
  const inventarisKode =
    items.length === 1
      ? first.inventaris_kode
      : `${first.inventaris_kode} +${items.length - 1}`;
  const itemSummary = items
    .slice(0, 2)
    .map((item) => `${item.jumlah_pinjam}x ${item.inventaris_nama}`)
    .join(", ");

  return {
    item_count: items.length,
    total_quantity: totalQuantity,
    inventaris_nama: inventarisNama,
    inventaris_kode: inventarisKode,
    item_summary:
      items.length <= 2
        ? itemSummary
        : `${itemSummary}, +${items.length - 2} alat lain`,
  };
}

export function buildNotificationItemLabel(
  items: BorrowingItemSummary[],
): string {
  if (!items.length) return "alat laboratorium";
  if (items.length === 1) return items[0].inventaris_nama;
  return `${items.length} alat (${items
    .slice(0, 2)
    .map((item) => item.inventaris_nama)
    .join(", ")}${items.length > 2 ? ", dst." : ""})`;
}
