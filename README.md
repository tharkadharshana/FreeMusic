# Audio Copyright Sentinel

Browser extension (Chrome, Edge, Brave, Firefox) that shows a caution card when a song from the
**ACPOSL public catalogue** plays in a tab: YouTube, Spotify Web, SoundCloud or any `<audio>`/`<video>` player.
A small web app checks titles, updates the catalogue and documents releases.

> The catalogue is a public-source discovery list, **not** a legal ownership register. A match means
> "check with ACPOSL", not "this is owned". No match does not mean a song is free to use.

## Layout

| Path | What |
|---|---|
| `extension/` | The extension itself: load this folder unpacked, or zip it for the stores |
| `extension/matcher.js` | Matching rule, shared by the extension, the web app and the tests |
| `extension/rules.json` | Song list (generated). Also served over the air from GitHub |
| `src/` | Web app: check a song, update the catalogue, install & release guide |
| `scripts/build-rules.mjs` | Catalogue CSV/XLSX → `extension/rules.json` |
| `scripts/test-matcher.mjs` | Self-check (`npm test`) |
| `docs/ACPOSL/` | Source catalogue exports |

## Matching rule

A catalogue title on the page matches when one of its credited artists is also on the page, or when the title
has 3+ words. A 2+ word ACPOSL artist name on the page matches on its own. One- and two-word titles alone
(e.g. "Amma") never match, which avoids false alarms on common words. Songs added in the popup always match.

## Develop

```bash
npm install
npm run dev     # web app on http://localhost:3000
npm test        # matcher self-check
npm run lint && npm run build
```

Try the extension in Chrome/Edge/Brave: `chrome://extensions` → Developer mode → **Load unpacked** → pick `extension/`.
Firefox needs `background.scripts` instead of `service_worker`: use `audio-copyright-sentinel-firefox.zip` from the
`extension-zips` artifact of any GitHub Actions run (`about:debugging` → Load Temporary Add-on).

## Update the song list (no store review)

```bash
npm run rules -- docs/ACPOSL/acposl-public-song-catalogue.csv   # or use the web app's Catalogue tab
git add extension/rules.json && git commit -m "chore: update ACPOSL catalogue" && git push
```

Installed extensions fetch
`https://raw.githubusercontent.com/tharkadharshana/FreeMusic/main/extension/rules.json` every 6 hours
(or on **Check for updates** in the popup). **The repo must be public** for this URL to work.

## Release new code (stores)

1. Bump `"version"` in `extension/manifest.json`.
2. `git tag v1.2.1 && git push origin main v1.2.1`

`.github/workflows/release.yml` runs the tests, checks the tag matches the manifest, zips `extension/`, and
uploads it to the Chrome Web Store and Firefox Add-ons. Stores still review each release (1–7 days).

### One-time setup

1. Make the repo public.
2. Create a Chrome Web Store developer account (US$5) and a Firefox Add-ons account.
3. Download the `extension-zips` artifact from any Actions run and upload by hand once to each store
   (`audio-copyright-sentinel-firefox.zip` to Firefox) to create the listings.
4. Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Where |
|---|---|
| `CHROME_EXTENSION_ID` | Chrome Web Store Developer Dashboard, item ID |
| `CHROME_PUBLISHER_ID` | Developer Dashboard → Account |
| `CHROME_CLIENT_ID` / `CHROME_CLIENT_SECRET` | Google Cloud Console → Credentials → OAuth client |
| `CHROME_REFRESH_TOKEN` | OAuth 2.0 Playground, scope `https://www.googleapis.com/auth/chromewebstore` |
| `FIREFOX_JWT_ISSUER` / `FIREFOX_JWT_SECRET` | addons.mozilla.org → Developer Hub → Manage API keys |
