export function errorStatus(error: { code?: string; message?: string }): 'unauthorized' | 'error' {
  return ['42501', 'PGRST301', 'PGRST302'].includes(error.code || '') || /permission denied|jwt expired/i.test(error.message || '')
    ? 'unauthorized' : 'error';
}

export function consolidateSummary(rows: any[] | any | null) {
  if (!rows) return null;
  if (!Array.isArray(rows)) return rows;
  if (!rows.length) return null;
  const fields = ['income_gross', 'taxes', 'income_after_tax', 'outflows', 'net_real', 'evidenced_movements', 'evidence_documents', 'income_collected', 'verified_cash_movements'];
  return Object.fromEntries(fields.map(field => [field, rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)]));
}

export function filterBusinesses<T extends { name: string; slug: string; summary?: string; sector?: string; city?: string }>(rows: T[], query: string): T[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const needle = normalize(query.trim());
  return needle ? rows.filter(row => normalize([row.name, row.slug, row.summary, row.sector, row.city].join(' ')).includes(needle)) : rows;
}
