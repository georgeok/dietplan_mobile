import i18n from '@/i18n';

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(i18n.language || 'el', options).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(i18n.language || 'el', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatKg(kg: number): string {
  return `${formatNumber(kg, { maximumFractionDigits: 1 })} kg`;
}
