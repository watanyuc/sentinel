/**
 * Export data to CSV and trigger download.
 */

const escapeCSV = (value: unknown): string => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[],
): void => {
  if (data.length === 0) return;

  const cols = columns ?? Object.keys(data[0]).map(key => ({ key: key as keyof T, label: key as string }));

  const header = cols.map(c => escapeCSV(c.label)).join(',');
  const rows = data.map(row =>
    cols.map(c => escapeCSV(row[c.key])).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
