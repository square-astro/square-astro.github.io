# SQuARE Group website

Website for the Survey-based Quasar Analysis and Research for Evolution group
at Sejong University.

## Content

- Member records: `src/data/members.json`
- Publications: `src/data/publications.bib`
- Research pages: `src/pages/research.astro`
- Images and CV: `public/`

The publication parser automatically marks papers with `Kim, Y.` as the first
author as selected. For a corresponding-author paper, add the custom BibTeX
field below to its entry:

```bibtex
corresponding = {Kim, Y.}
```

## Local development

```sh
pnpm install
pnpm dev
```

The production site is configured for
`https://square-astro.github.io/` and deploys through GitHub Actions.
