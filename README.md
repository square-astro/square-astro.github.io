# SQuARE Group website

Website for the Survey-based Quasar Analysis and Research for Evolution group
at Sejong University.

## Content

- Member records: `src/data/members.json`
- Publications: `src/data/publications.bib`
- Research topics and image paths: `src/data/research.json`
- Images and CV: `public/`

Paste the BibTeX exported by ADS directly into `src/data/publications.bib`.
All entries appear in the full publication list. To include an entry in the
Selected filter and the home-page highlights, add this custom field before the
closing brace:

```bibtex
selected = {true}
```

Research images belong in `public/images/research/`. Add the public image path,
alternative text, and caption to the matching record in `src/data/research.json`.
An empty `image` value leaves the image area blank.

## Local development

```sh
pnpm install
pnpm dev
```

The production site is configured for
`https://square-astro.github.io/` and deploys through GitHub Actions.
