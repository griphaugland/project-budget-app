import { DEFAULT_CATEGORIES } from '@/constants/categories';

export interface CsvRow {
  date: string;
  description: string;
  amount: number;
}

export function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const separator = header.includes('\t') ? '\t' : header.includes(';') ? ';' : ',';

  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  // Find column indices — flexible matching
  const dateIdx = headers.findIndex((h) =>
    ['date', 'dato', 'transaction_date', 'bokført', 'bokfort', 'valuteringsdato'].includes(h)
  );
  const descIdx = headers.findIndex((h) =>
    ['description', 'beskrivelse', 'merchant', 'butikk', 'forklaring', 'tekst', 'melding'].includes(h)
  );
  const amountIdx = headers.findIndex((h) =>
    ['amount', 'beløp', 'belop', 'sum', 'inn/ut', 'ut', 'transaksjon'].includes(h)
  );

  // If we can't find columns, try positional (common bank export: date, description, amount)
  const dIdx = dateIdx >= 0 ? dateIdx : 0;
  const mIdx = descIdx >= 0 ? descIdx : 1;
  const aIdx = amountIdx >= 0 ? amountIdx : headers.length - 1;

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCsvLine(line, separator);
    if (cols.length < Math.max(dIdx, mIdx, aIdx) + 1) continue;

    const rawDate = cols[dIdx].replace(/"/g, '').trim();
    const description = cols[mIdx].replace(/"/g, '').trim();
    const rawAmount = cols[aIdx].replace(/"/g, '').trim();

    const date = normalizeDate(rawDate);
    const amount = parseNorwegianNumber(rawAmount);

    if (!date || isNaN(amount) || !description) continue;

    rows.push({ date, description, amount });
  }

  return rows;
}

function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizeDate(raw: string): string | null {
  // Handle various date formats
  // DD.MM.YYYY or DD/MM/YYYY
  let match = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }
  // YYYY-MM-DD
  match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return raw;
  // DD-MM-YYYY
  match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  return null;
}

function parseNorwegianNumber(raw: string): number {
  // Norwegian format: 1 234,56 or 1.234,56 — comma is decimal separator
  let cleaned = raw.replace(/\s/g, '');
  // If it has both . and , — the last one is the decimal separator
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Norwegian: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // English: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  return parseFloat(cleaned);
}

export function guessCategory(description: string): string {
  const desc = description.toLowerCase();

  const groceryPatterns = ['rema', 'kiwi', 'meny', 'bunnpris', 'coop', 'extra', 'spar ', 'joker', 'dagligvare', 'matbutikk'];
  const transportPatterns = ['skyss', 'circle k', 'esso', 'shell', 'bensin', 'bompenger', 'parkering', 'ruter', 'nsb', 'vy ', 'taxi'];
  const foodDrinkPatterns = ['restaurant', 'cafe', 'kaffe', 'pizza', 'burger', 'sushi', 'bar ', 'pub ', 'takeaway', 'foodora', 'wolt', 'just eat', 'espresso'];
  const subscriptionPatterns = ['spotify', 'netflix', 'hbo', 'disney', 'youtube', 'apple.com', 'google play', 'gym', 'sats ', 'trening'];
  const essentialPatterns = ['husleie', 'leie', 'strøm', 'strom', 'forsikring', 'telenor', 'telia', 'ice.no', 'kommune', 'skatt'];

  if (groceryPatterns.some((p) => desc.includes(p))) return 'cat-groceries';
  if (transportPatterns.some((p) => desc.includes(p))) return 'cat-transport';
  if (foodDrinkPatterns.some((p) => desc.includes(p))) return 'cat-food-drink';
  if (subscriptionPatterns.some((p) => desc.includes(p))) return 'cat-subscriptions';
  if (essentialPatterns.some((p) => desc.includes(p))) return 'cat-essentials';

  return 'cat-pocket-money';
}
