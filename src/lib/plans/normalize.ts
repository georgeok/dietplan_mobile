/**
 * Normalize a free-text food name into a stable cache key. Greek diacritics
 * are stripped, case-folded, punctuation removed.
 */
export function normalizeFoodName(name: string): string {
  return name
    .toLocaleLowerCase('el')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
