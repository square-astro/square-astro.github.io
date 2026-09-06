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
  corresponding?: string;
  selected: boolean;
}

const SELECTED_AUTHOR = 'Kim, Y.';

function readField(body: string, field: string): string {
  const match = body.match(new RegExp(`(?:^|\\n)\\s*${field}\\s*=\\s*[\\{\"]([^}\"]*)[}\\"]\\s*,?`, 'i'));
  return match?.[1]?.trim() ?? '';
}

export function parseBibTeX(source: string): Publication[] {
  const entries = source.match(/@\w+\s*\{[\s\S]*?\n\}/g) ?? [];

  return entries
    .map((entry) => {
      const id = entry.match(/@\w+\s*\{\s*([^,]+),/)?.[1]?.trim() ?? '';
      const author = readField(entry, 'author');
      const corresponding = readField(entry, 'corresponding');
      const normalize = (name: string) => name.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const firstAuthor = author.split(/\s+and\s+/i)[0] ?? '';
      const correspondingAuthors = corresponding.split(/\s+and\s+/i).filter(Boolean);
      const selected = normalize(firstAuthor) === normalize(SELECTED_AUTHOR)
        || correspondingAuthors.some((name) => normalize(name) === normalize(SELECTED_AUTHOR));

      return {
        id,
        title: readField(entry, 'title'),
        author,
        year: Number(readField(entry, 'year')),
        journal: readField(entry, 'journal'),
        volume: readField(entry, 'volume') || undefined,
        pages: readField(entry, 'pages') || undefined,
        status: readField(entry, 'status') || undefined,
        adsurl: readField(entry, 'adsurl') || undefined,
        corresponding: corresponding || undefined,
        selected,
      };
    })
    .filter((entry) => entry.id && entry.title && entry.year)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export function formatAuthors(authors: string): string {
  return authors
    .split(/\s+and\s+/)
    .map((author) => author === 'others' ? 'et al.' : author)
    .join(', ');
}
