# Netflix Catalogue Compare

A lightweight static web app that compares titles listed on Netflix in the United States against titles listed on Netflix in Canada.

## How it works

The app queries TMDB Discover twice for each page:

- Netflix, watch region `US`
- Netflix, watch region `CA`

It then subtracts Canadian TMDB title IDs from the matching US results.

## Important limitation

The comparison is performed page by page using the selected TMDB sort order. This is practical for browsing likely catalogue differences, but it is not a mathematically complete snapshot of every Netflix title in both countries unless all available pages are scanned.

TMDB caps Discover results at 500 pages. Streaming availability can also lag behind recent licensing changes.

## Setup

1. Create a free TMDB account.
2. Request API access.
3. Copy your **API Read Access Token**.
4. Open the app and select **API Settings**.
5. Paste the token and save it.

The token is stored in browser `localStorage`. It is not included in the repository.

## Local use

Open `index.html` directly, or serve the folder with any basic web server.

Example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

Upload these files to a repository, then enable Pages from the repository's main branch.

## Data attribution

Streaming availability data is provided by JustWatch through TMDB. JustWatch attribution must remain visible.

Movie and TV metadata is provided by TMDB.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
