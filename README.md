# kc31415.github.io

Personal portfolio site for Kechun Wu, served at https://kc31415.github.io.

Plain HTML/CSS with one small script (theme toggle). No framework and no build step: GitHub Pages serves the files as they are.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page. Project cards sit between `PROJECT CARDS: EDIT HERE` and `END PROJECT CARDS`. |
| `styles.css` | Styles, including light/dark colors (top of file). |
| `script.js` | Light/dark toggle and footer year. |
| `assets/img/` | Project screenshots, social preview image (`og.png`), touch icon. |
| `favicon.svg` | Browser tab icon. |
| `404.html` | Not-found page. |
| `resume.pdf` | Resume linked from the page. Replace the file to update it. |

## Common edits

- **Experience / About:** plain HTML sections in `index.html` (`EXPERIENCE`, `ABOUT`), copied from the resume.
- **Resume:** replace `resume.pdf` in the repository root.
- **Projects:** each project is one `<article class="card">` block. Copy a block to add a project.
- **Screenshots:** drop an image in `assets/img/` (16:10, e.g. 1200x750, looks best; the top is kept if it's taller) and update that card's `<img src>`. AI Adoption Tracker still uses a placeholder (`ai-adoption-tracker.svg`).
- **Preview locally:** open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.
