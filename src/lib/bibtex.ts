import { parse } from '@retorquere/bibtex-parser';

export interface Publication {
  id: string;
  title: string;
  author: string;
  year: number;
  journal: string;
  volume?: string;
  pages?: string;
  status?: string;
  adsurl?: string;
  doi?: string;
  selected: boolean;
}

interface ParsedAuthor {
  firstName?: string;
  lastName?: string;
  prefix?: string;
  suffix?: string;
  literal?: string;
}

const JOURNAL_NAMES: Record<string, string> = {
  '\\aap': 'A&A',
  '\\aj': 'AJ',
  '\\apj': 'ApJ',
  '\\apjl': 'ApJL',
  '\\apjs': 'ApJS',
  '\\araa': 'ARA&A',
  '\\jkas': 'JKAS',
  '\\mnras': 'MNRAS',
  '\\nat': 'Nature',
  '\\pasp': 'PASP',
  '\\prd': 'Physical Review D',
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatParsedAuthor(author: ParsedAuthor): string {
  if (author.literal) return author.literal;

  const lastName = [author.prefix, author.lastName].filter(Boolean).join(' ');
  const suffix = author.suffix ? `, ${author.suffix}` : '';
  return author.firstName ? `${lastName}${suffix}, ${author.firstName}` : `${lastName}${suffix}`;
}

function readAuthors(value: unknown): string {
  if (!Array.isArray(value)) return asString(value);
  return value.map((author) => formatParsedAuthor(author as ParsedAuthor)).filter(Boolean).join(' and ');
}

function formatJournal(value: unknown): string {
  const journal = asString(value);
  return JOURNAL_NAMES[journal.toLowerCase()] ?? journal.replace(/^\\/, '');
}

function cleanUrl(value: unknown): string | undefined {
  const url = asString(value);
  if (!url) return undefined;
  const markdownLink = url.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/);
  return markdownLink?.[1] ?? url;
}

export function parseBibTeX(source: string): Publication[] {
  const bibliography = parse(source, { sentenceCase: false });

  return bibliography.entries
    .map((entry) => {
      const fields = entry.fields;
      const pages = asString(fields.pages) || asString(fields.eid) || undefined;
      return {
        id: entry.key,
        title: asString(fields.title),
        author: readAuthors(fields.author),
        year: Number(asString(fields.year)),
        journal: formatJournal(fields.journal),
        volume: asString(fields.volume) || undefined,
        pages,
        status: asString(fields.status) || undefined,
        adsurl: cleanUrl(fields.adsurl),
        doi: asString(fields.doi) || undefined,
        selected: asString(fields.selected).toLowerCase() === 'true',
      };
    })
    .filter((entry) => entry.id && entry.title && entry.year)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export function formatAuthors(authors: string): string {
  const names = authors
    .split(/\s+and\s+/i)
    .map((author) => author.toLowerCase() === 'others' ? 'et al.' : author)
    .filter(Boolean);

  if (names.includes('et al.')) return names.join(', ');
  if (names.length > 6) return `${names.slice(0, 6).join(', ')}, et al.`;
  return names.join(', ');
}
