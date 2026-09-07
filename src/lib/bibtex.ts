import { parse } from '@retorquere/bibtex-parser';

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  year: number;
  month?: number;
  journal: string;
  volume?: string;
  pages?: string;
  status?: string;
  adsurl?: string;
  doi?: string;
  selected: boolean;
}

export interface PublicationOverride {
  selected?: boolean;
  date?: string;
  status?: string;
}

export type PublicationOverrides = Record<string, PublicationOverride>;

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

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
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

function readAuthors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return asString(value).split(/\s+and\s+/i).map((author) => author.trim()).filter(Boolean);
  }

  return value.map((author) => formatParsedAuthor(author as ParsedAuthor)).filter(Boolean);
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

function parseMonth(value: unknown): number | undefined {
  const month = asString(value).toLowerCase().replace(/[{}\\"]/g, '');
  if (!month) return undefined;

  const numericMonth = Number(month);
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) return numericMonth;
  return MONTHS[month.slice(0, 3)];
}

function inferArxivMonth(id: string, eprint: unknown): number | undefined {
  const arxivId = asString(eprint) || id.match(/arxiv(\d{4})/i)?.[1] || '';
  const compactDate = arxivId.match(/^(\d{2})(\d{2})/);
  if (!compactDate) return undefined;

  const month = Number(compactDate[2]);
  return month >= 1 && month <= 12 ? month : undefined;
}

function readOverrideDate(date: string | undefined): { year?: number; month?: number } {
  const match = date?.match(/^(\d{4})-(\d{2})/);
  if (!match) return {};
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function parseBibTeX(source: string, overrides: PublicationOverrides = {}): Publication[] {
  // Older hand-maintained entries used URL-encoded ampersands in ADS bibcodes.
  // A bare percent sign starts a BibTeX comment, so normalize those URLs first.
  const bibliography = parse(source.replace(/%26/gi, '&'), { sentenceCase: false });

  return bibliography.entries
    .map((entry, sourceIndex) => {
      const fields = entry.fields;
      const override = overrides[entry.key] ?? {};
      const overrideDate = readOverrideDate(override.date);
      const year = overrideDate.year ?? Number(asString(fields.year));
      const month = overrideDate.month ?? parseMonth(fields.month) ?? inferArxivMonth(entry.key, fields.eprint);
      const pages = asString(fields.pages) || asString(fields.eid) || undefined;
      return {
        id: entry.key,
        title: asString(fields.title),
        authors: readAuthors(fields.author),
        year,
        month,
        journal: formatJournal(fields.journal),
        volume: asString(fields.volume) || undefined,
        pages,
        status: override.status ?? (asString(fields.status) || undefined),
        adsurl: cleanUrl(fields.adsurl),
        doi: asString(fields.doi) || undefined,
        selected: override.selected ?? asString(fields.selected).toLowerCase() === 'true',
        sourceIndex,
      };
    })
    .filter((entry) => entry.id && entry.title && entry.year)
    .sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0) || a.sourceIndex - b.sourceIndex)
    .map(({ sourceIndex: _sourceIndex, ...entry }) => entry);
}

function normalizeAuthorName(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isGroupAuthor(name: string, groupAuthorNames: string[]): boolean {
  const normalizedName = normalizeAuthorName(name);
  return groupAuthorNames.some((groupName) => normalizeAuthorName(groupName) === normalizedName);
}

export function formatAuthors(authors: string[], groupAuthorNames: string[] = [], leadingAuthorCount = 2): string {
  const names = authors.filter(Boolean);
  if (names.length === 0) return '';

  const isOthers = (name: string) => /^(others|et al\.?|and others)$/i.test(name.trim());
  const knownAuthors = names
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => !isOthers(name));

  if (!names.some(isOthers) && knownAuthors.length <= 6) {
    return knownAuthors.map(({ name }) => name).join(', ');
  }

  const included = knownAuthors.filter(({ name }, knownIndex) => (
    knownIndex < leadingAuthorCount || isGroupAuthor(name, groupAuthorNames)
  ));

  const output: string[] = [];
  included.forEach((author, index) => {
    const previous = included[index - 1];
    if (previous && author.index - previous.index > 1) output.push('…');
    output.push(author.name);
  });

  const finalIncludedIndex = included.at(-1)?.index ?? -1;
  if (names.slice(finalIncludedIndex + 1).length > 0) output.push('et al.');

  return output.join(', ');
}
