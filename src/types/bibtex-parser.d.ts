declare module '@retorquere/bibtex-parser' {
  export interface BibTeXEntry {
    type: string;
    key: string;
    fields: Record<string, unknown>;
    input: string;
  }

  export interface BibTeXLibrary {
    entries: BibTeXEntry[];
    errors: Array<{ error: string; input: string }>;
  }

  export function parse(
    input: string,
    options?: { sentenceCase?: boolean },
  ): BibTeXLibrary;
}
