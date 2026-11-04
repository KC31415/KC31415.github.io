# kechunwu.github.io

Kechun Wu's personal site, served at https://kechunwu.github.io.

Plain HTML, CSS and vanilla JS. No framework, no build step, no trackers.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The whole page. Each project is one `<article class="entry">` under "SELECTED WORK". |
| `assets/site.css` | Styles: color tokens at the top (light, then dark), print stylesheet at the bottom. |
| `assets/site.js` | Theme toggle, live Morning Brief strip, Earnings Desk demo, SDK chart, section reveal. |
| `assets/fonts/` | Newsreader and JetBrains Mono, subset and self-hosted (SIL OFL; licenses included). |
| `assets/img/` | Morning Brief screenshot (WebP, 1x and 2x), social preview `og.png`, touch icon. |
| `data/sdk-share.json` | Snapshot of the AI Adoption Tracker's SDK download shares, used by the chart. |
| `scripts/snapshot.py` | Rebuilds `data/sdk-share.json` from the tracker's published CSV. |
| `scripts/check_links.py` | Link checker run in CI. |
| `.github/workflows/pages.yml` | Deploys to GitHub Pages on push and daily; refreshes the snapshot and stamps "last updated". |

## Live data

- **Morning Brief strip** (top of page): the browser fetches `/morning-brief/latest.json`, which the
  morning-brief repo publishes. If the fetch fails the strip is hidden; if the data is more than one business
  day old it turns grey and says "last updated".
- **SDK chart**: `data/sdk-share.json`, refreshed daily by the workflow from
  `/ai-adoption-tracker/data/entity_weekly.csv`. If that download fails, the committed copy is kept.
- **Earnings Desk demo**: a fixed excerpt from the published PLTR FY2026 Q3 note (claims, verdicts and
  source details copied from `earnings-desk/data/notes/PLTR/0001321655-26-000045.json`).

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The live strip and project links need the other repos' sites, so they
only work on the deployed site.

## Checks

```bash
python3 scripts/check_links.py .
```

## How this was built

Plain HTML, CSS and JavaScript, written with Claude Code, Anthropic's AI coding assistant (see the `Co-Authored-By` lines in the commit history). The page footer says the same.
