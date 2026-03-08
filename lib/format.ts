// Formatting utilities for Norwegian currency and dates

/**
 * Format amount as Norwegian kroner
 * Examples: 1 234 kr, -342 kr
 */
export function formatNOK(amount: number, showSign = false): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (showSign && amount < 0) return `-${formatted} kr`;
  if (showSign && amount > 0) return `+${formatted} kr`;
  return `${formatted} kr`;
}

/**
 * Format a compact amount (no "kr" suffix) for hero display
 */
export function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format date as "8. mars" or "1. mars 2026"
 */
export function formatDateNO(dateStr: string, includeYear = false): string {
  const date = new Date(dateStr);
  const months = [
    'januar', 'februar', 'mars', 'april', 'mai', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'desember',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  if (includeYear) return `${day}. ${month} ${date.getFullYear()}`;
  return `${day}. ${month}`;
}

/**
 * Format relative time: "2 min siden", "1 time siden", etc.
 */
export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'nå';
  if (diffMin < 60) return `${diffMin} min siden`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'time' : 'timer'} siden`;
  return formatDateNO(dateStr);
}

/**
 * Group transactions by date for the transaction list
 */
export function groupByDate<T extends { transaction_date: string }>(
  items: T[]
): { date: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = item.transaction_date;
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(item);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}
