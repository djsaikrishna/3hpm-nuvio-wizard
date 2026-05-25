# 3HPM Nuvio Wizard

A small static web app for generating clean scraper manifest URLs for Nuvio Connected Services.

## Current scope

V1 supports Comet only.

The generated manifest is intended for the new Nuvio Connected Services flow:

1. Connect TorBox inside Nuvio under Settings → Connected Services.
2. Generate a Comet manifest with this wizard.
3. Add the generated manifest URL to Nuvio.
4. Rename the addon in the Nuvio web account, for example: `3HPM | Comet TB Instant`.

## Important

This tool does not ask for, store, or embed any TorBox API key.

TorBox authentication belongs in Nuvio Connected Services, not in the generated scraper manifest.

## Files

- `index.html` contains the page markup.
- `style.css` contains the visual styling.
- `app.js` builds the Comet config, Base64-encodes it, and outputs the manifest URL.

## Roadmap

- Test generated Comet manifests in Nuvio.
- Add Torrentio support after confirmed config mapping.
- Add better presets for low bandwidth, best quality, and maximum results.
- Add optional shareable preset links.
- Add hosted deployment on GitHub Pages or Cloudflare Pages.

## Disclaimer

This is an independent 3HPM utility. It is not affiliated with Nuvio, Comet, or TorBox.
