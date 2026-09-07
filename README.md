# SQuARE Group website

Website for the Survey-based Quasar Analysis and Research for Evolution group
at Sejong University.

## Content

- Member records: `src/data/members.json`
- ADS publication export: `src/data/publications.bib`
- Publication selections and exceptions: `src/data/publication-overrides.json`
- Research topics and image paths: `src/data/research.json`
- Images and CV: `public/`

## Updating publications

`publications.bib` is a snapshot of the public ADS Library linked from the
website. To refresh it, create an ADS API token and run:

```sh
ADS_API_TOKEN=your_token pnpm publications:update
```

The token is used only for that command and must never be added to the
repository. The updater requests complete ADS author lists and leaves the
existing file untouched if the download is incomplete.

All imported records appear in the full publication list. To include a paper
in the Selected filter and the home-page highlights, add its ADS bibcode to
`src/data/publication-overrides.json`:

```json
{
  "2024ApJ...972..171K": {
    "selected": true
  }
}
```

The optional `date` (`YYYY-MM`) and `status` values are only for records that
need information not supplied by the ADS export. Publications are sorted by
year and month, newest first. Records without a month retain their ADS export
order after dated records from the same year.

The author display keeps the leading authors and any SQuARE member listed later
in a long author list. Add each member's ADS name variants to the
`publicationNames` field in `src/data/members.json`.

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
