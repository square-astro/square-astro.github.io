import { writeFile } from 'node:fs/promises';

const ADS_API_BASE = 'https://api.adsabs.harvard.edu/v1';
const DEFAULT_LIBRARY_ID = '-qlmCI7ySnmm8VvrhaHLLw';
const outputPath = new URL('../src/data/publications.bib', import.meta.url);

const token = process.env.ADS_API_TOKEN;
const libraryId = process.env.ADS_LIBRARY_ID || DEFAULT_LIBRARY_ID;

if (!token) {
  throw new Error('ADS_API_TOKEN is required. Keep it in your shell environment, not in the repository.');
}

const headers = { Authorization: `Bearer ${token}` };
const libraryUrl = `${ADS_API_BASE}/biblib/libraries/${encodeURIComponent(libraryId)}?raw=true&rows=2000`;
const libraryResponse = await fetch(libraryUrl, { headers });

if (!libraryResponse.ok) {
  throw new Error(`Could not read the ADS library (${libraryResponse.status} ${libraryResponse.statusText}).`);
}

const library = await libraryResponse.json();
const bibcodes = Array.isArray(library.documents) ? library.documents.filter(Boolean) : [];

if (bibcodes.length === 0) {
  throw new Error('The ADS library returned no publications; the existing BibTeX file was left unchanged.');
}

const exportResponse = await fetch(`${ADS_API_BASE}/export/bibtex`, {
  method: 'POST',
  headers: {
    ...headers,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bibcode: bibcodes,
    sort: 'date desc, bibcode desc',
    maxauthor: 0,
    authorlimit: 2000,
  }),
});

if (!exportResponse.ok) {
  throw new Error(`Could not export BibTeX from ADS (${exportResponse.status} ${exportResponse.statusText}).`);
}

const exported = await exportResponse.json();
const bibtex = typeof exported.export === 'string' ? exported.export.trim() : '';
const entryCount = bibtex.match(/^@\w+\s*{/gm)?.length ?? 0;

if (!bibtex || entryCount !== bibcodes.length) {
  throw new Error(`ADS returned ${entryCount} BibTeX entries for ${bibcodes.length} library records; the existing file was left unchanged.`);
}

await writeFile(outputPath, `${bibtex}\n`, 'utf8');
console.log(`Updated publications.bib with ${entryCount} records from ADS.`);
