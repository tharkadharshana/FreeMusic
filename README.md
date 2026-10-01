# Audio Copyright Sentinel

Browser extension for Chrome, Edge, Brave and Firefox. It shows a caution card when a song from the
**ACPOSL public catalogue** plays in a browser tab. It runs on YouTube, YouTube Music, Spotify Web, SoundCloud, Facebook, Instagram and TikTok out of the box, and on every
site once the user clicks **Enable on all sites** in the popup. A companion web app checks titles, updates the catalogue, and explains releases.

> **Disclaimer.** The catalogue is a public-source discovery list, **not** a legal ownership register. A match
> means "check with ACPOSL before using this song", not "this song is owned by X". No match does **not** mean a
> song is free to use.

Copyright © 2026 Tharka Karunanayake. All rights reserved. See [LICENSE](LICENSE).

---

## Contents

1. [How it works](#how-it-works)
2. [Repository layout](#repository-layout)
3. [Matching rule](#matching-rule)
4. [Quick start](#quick-start)
5. [Updating the song list](#updating-the-song-list-no-store-review)
6. [Releasing a new extension version](#releasing-a-new-extension-version)
7. [Publishing to the stores for the first time](#publishing-to-the-stores-for-the-first-time)
8. [Setting up automatic releases (CI secrets)](#setting-up-automatic-releases-ci-secrets)
9. [Testing checklist](#testing-checklist)
10. [Troubleshooting](#troubleshooting)
11. [Privacy](#privacy)
12. [License](#license)

---

## How it works

Updates take two separate paths:

| What changes | How it reaches users | Store review? | Time to users |
|---|---|---|---|
| **Song list** (`extension/rules.json`) | Push it to `main`. Every installed extension downloads it from GitHub | No | Within 6 hours, or at next browser start |
| **Extension code** (JS, HTML, manifest) | Bump the version and push a `v*` tag. GitHub Actions uploads to both stores | Yes | 1–7 days |

The song list is served from
`https://raw.githubusercontent.com/tharkadharshana/FreeMusic/main/extension/rules.json`.
**The repository must stay public** for this URL to work. The raw ACPOSL exports are never published: they
live in `docs/ACPOSL/`, which is git-ignored.

Inside the extension:
- **`content.js`** runs on the major music sites listed in `manifest.json` (YouTube, YouTube Music, Spotify Web, SoundCloud, Facebook, Instagram and TikTok).
  If the user clicks **Enable on all sites**, `background.js` asks for the optional `<all_urls>` permission
  and registers the same script for every other site (`chrome.scripting`). Every 2 seconds, if any audio or video is playing, it reads the
  MediaSession title and artist, the page title, and the YouTube channel name. It runs the matcher only when
  that text changes, and shows the caution card on a match.
- **`background.js`** loads the bundled `rules.json` on install. It re-downloads the list from GitHub every
  6 hours and on browser start, and checks the file's shape before saving it. It also sets the red **!**
  badge on the toolbar icon.
- **`popup.html`** has the on/off switch, catalogue size, last update, **Check for updates**, a search box
  ("Is this song listed?"), and **My additions**: your own songs, which always warn and are never overwritten
  by updates.

## Repository layout

| Path | What |
|---|---|
| `extension/` | The extension itself. Load this folder unpacked; CI zips it for the stores |
| `extension/manifest.json` | Manifest V3 (Chrome format). Version number lives here |
| `extension/matcher.js` | The matching rule. Shared by the extension, the web app and the tests |
| `extension/content.js` | Detects playing media and shows the caution card |
| `extension/background.js` | Song-list download (every 6 h + browser start), badge |
| `extension/popup.html` / `popup.js` | Toolbar popup |
| `extension/rules.json` | Song list (**generated**, never edit by hand) |
| `extension/icons/` | 16 / 48 / 128 px icons |
| `src/` | Web app (React + Vite + Tailwind): Check song, Catalogue, Install & release |
| `src/lib/catalogue.js` | Converts catalogue rows into `rules.json` (used by the web app and the script) |
| `scripts/build-rules.mjs` | Command-line catalogue (CSV/XLSX) → `extension/rules.json` |
| `scripts/test-matcher.mjs` | Matcher self-check (`npm test`) |
| `.github/workflows/release.yml` | CI: test, lint, build, package zips; publish to stores on `v*` tags |
| `store/` | Store listing text, screenshots, promo tile |
| `PRIVACY.md` | Privacy policy (URL used in both store listings) |
| `LICENSE` | Proprietary license, all rights reserved |
| `docs/ACPOSL/` | Raw catalogue exports, **local only** (git-ignored) |

## Matching rule

A catalogue song title found on the page warns when **any** of these hold:
- one of the song's **credited artists** is also on the page;
- the title has **3 or more words** (rare enough to stand alone);
- you added the song yourself under **My additions**.

Separately, an ACPOSL **artist name of 2 or more words** on the page warns on its own.

One- and two-word titles alone (e.g. "Amma", 301 titles) **never** match without an artist, which prevents
false alarms on common words. Matching is whole-word, so "Amma" never matches inside "Ammawarune".

Known limit: spelling variants of a title ("Na Kiya" vs "Ne Kiya") are not matched. Add the variant as an
extra catalogue row if you see misses.

## Quick start

Requirements: Node.js 22+ and Git. Optionally the GitHub CLI (`gh`).

```bash
npm install
npm run dev      # web app on http://localhost:3000
npm test         # matcher self-check
npm run lint     # TypeScript type check
npm run build    # production build of the web app
```

**Load the extension in Chrome, Edge or Brave**
1. Open `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick the `extension/` folder.
4. After any code change, click the reload icon on the extension card.

**Load the extension in Firefox.** Firefox needs `background.scripts` instead of `service_worker`, so use the
Firefox build from CI:
1. In GitHub, open **Actions**, then the latest run, and download the `extension-zips` artifact.
2. In Firefox, open `about:debugging`, then **This Firefox → Load Temporary Add-on**, and pick
   `audio-copyright-sentinel-firefox.zip`.
3. In `about:addons`, open the add-on's **Permissions** tab and allow access to all websites.

## Updating the song list (no store review)

Run this whenever the catalogue changes. Work on a branch:

```bash
git checkout main && git pull
git checkout -b chore/catalogue-YYYY-MM-DD

# 1. Put the new export in docs/ACPOSL/, then regenerate:
npm run rules -- docs/ACPOSL/acposl-public-song-catalogue.csv
#    (or: web app → Catalogue tab → upload → Download rules.json → replace extension/rules.json)

# 2. Commit, open a PR, merge to main:
git commit -am "chore: update ACPOSL catalogue"
git push -u origin HEAD
gh pr create --fill
gh pr merge --merge
```

After the merge:
- Users get the new list within **6 hours** or at their next browser start. Anyone can also click
  **Check for updates** in the popup.
- Allow **5–10 minutes** after merging. GitHub caches raw files for up to 5 minutes per cache node, so an
  early **Check for updates** may still say "Up to date".
- Check that the live file has updated:
  ```bash
  curl -s https://raw.githubusercontent.com/tharkadharshana/FreeMusic/main/extension/rules.json | head -c 60
  ```

**Rules**
- **Always regenerate** with `npm run rules` or the web app. Both stamp a new `version`. A hand edit that
  keeps the old `version` is ignored by installed extensions.
- The catalogue file needs a **Song Title** column. Artist columns (`Matched Public Name`, `Member Name`,
  `Artist / Performer`) are read as credited names. Duplicate titles are merged.
- Song-list changes **never** need a version bump or a tag.

## Releasing a new extension version

Use this for code, UI, permission or manifest changes:

1. Make the change on a branch. Test it by loading the extension unpacked.
2. Bump `"version"` in `extension/manifest.json` (e.g. `1.2.0` → `1.2.1`). Bump `package.json` to match.
3. Open a PR and merge it. CI must be green.
4. Tag the release:
   ```bash
   git checkout main && git pull
   git tag v1.2.1
   git push origin v1.2.1
   ```
5. The workflow then:
   1. runs the tests, lint and build;
   2. checks that the tag matches the manifest version, and stops if it doesn't;
   3. builds `audio-copyright-sentinel.zip` (Chrome) and `audio-copyright-sentinel-firefox.zip`;
   4. uploads to the **Chrome Web Store**, which auto-publishes after review, and to **Firefox Add-ons**,
      which signs and publishes.
6. Watch progress in GitHub **Actions** and in each store dashboard.

**Release rules**
- Every release needs a **higher** version. Never reuse a version number.
- **Wait for the previous Chrome review to finish** before pushing the next tag. Chrome rejects uploads while
  an item is still in review.
- Adding permissions or host access triggers a longer review and may ask existing users to re-approve.

## Publishing to the stores for the first time

The first listing in each store is created **by hand**. After that, the CI workflow handles every release.

**Get the zips:** download the `extension-zips` artifact from any GitHub Actions run on `main`, or run:
```bash
gh run download --repo tharkadharshana/FreeMusic -n extension-zips
```

**Ready-made listing material** is in [`store/`](store/):
- [`store/LISTING.md`](store/LISTING.md): name, summary, description, privacy-tab answers and Firefox reviewer notes, ready to paste.
- `store/screenshot-*.png` (1280×800) and `store/promo-small-440x280.png`, captured from the real extension.
- Privacy policy URL: https://github.com/tharkadharshana/FreeMusic/blob/main/PRIVACY.md

The manifest already declares Firefox's required `data_collection_permissions: none`, and passes Mozilla's
`addons-linter` with 0 errors and 0 warnings.

### Chrome Web Store

1. Register at https://chrome.google.com/webstore/devconsole. It costs US$5 once and needs 2-step
   verification on your Google account. Declare yourself a non-trader if you don't sell anything.
2. Click **Add new item** and upload `audio-copyright-sentinel.zip`.
3. **Store listing:** name, description, category **Tools**, language. The 128 px icon comes from the zip.
   Add at least one **1280×800** screenshot: the caution card on YouTube and the popup work well.
4. **Privacy practices:**
   - **Single purpose:** "Warns the user when a song from the ACPOSL public catalogue plays in a tab."
   - **`storage`:** saves the song list, settings and the user's own additions.
   - **`alarms`:** refreshes the song list from GitHub every 6 hours.
   - **`scripting`:** registers the content script on every site only after the user opts in.
   - **Host permissions (the listed music sites, plus optional all sites):** reads the page title and media metadata locally to detect a catalogue
     song.
   - **Remote code:** No. `rules.json` is data (titles and names), not code.
   - **Data usage:** collects no user data. Privacy policy URL:
     `https://github.com/tharkadharshana/FreeMusic/blob/main/PRIVACY.md`. All answers are in `store/LISTING.md`.
5. Click **Submit for review**. Usually 1–3 days. Since 1.3.0 only the listed music sites are required, and all-sites access is optional and opt-in.
   This avoids Chrome's "Broad Host Permissions" in-depth review.
6. Note the 32-character **Item ID** (in the item's URL) and your **Publisher ID** (Account page) for CI.

### Firefox Add-ons (AMO)

1. Create a free account at https://addons.mozilla.org/developers/.
2. Click **Submit a New Add-on**, choose **On this site**, and upload `audio-copyright-sentinel-firefox.zip`.
3. When asked for source code: **No**. The code is plain, unminified JavaScript.
4. Fill in the listing and the privacy policy, then submit. It's signed automatically within minutes; a human
   may review later.

### Microsoft Edge Add-ons (optional)

Free at https://partner.microsoft.com/dashboard/microsoftedge. It accepts the same Chrome zip. CI does not
upload to Edge, so update it by hand.

## Setting up automatic releases (CI secrets)

### Chrome Web Store API

1. In https://console.cloud.google.com, create a project and enable **Chrome Web Store API**.
2. Set up the **OAuth consent screen** as External, then click **Publish app**.
   **Important:** while the app is in "Testing" mode, refresh tokens expire after 7 days and releases start
   failing.
3. Go to **Credentials → Create OAuth client ID**, type **Web application**, with redirect URI
   `https://developers.google.com/oauthplayground`.
4. Get the refresh token:
   1. Open https://developers.google.com/oauthplayground.
   2. Click the gear icon, tick **Use your own OAuth credentials**, and paste your client ID and secret.
   3. Enter the scope `https://www.googleapis.com/auth/chromewebstore`, then click **Authorize APIs**.
   4. Click **Exchange authorization code for tokens** and copy the **refresh token**.

### Firefox Add-ons API

Create keys at https://addons.mozilla.org/developers/addon/api/key/. This gives you a JWT issuer and a JWT
secret.

### GitHub repository secrets

In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `CHROME_EXTENSION_ID` | Item ID from the Chrome Developer Dashboard |
| `CHROME_PUBLISHER_ID` | Publisher ID (Developer Dashboard → Account) |
| `CHROME_CLIENT_ID` | OAuth client ID |
| `CHROME_CLIENT_SECRET` | OAuth client secret |
| `CHROME_REFRESH_TOKEN` | Refresh token from the OAuth Playground |
| `FIREFOX_JWT_ISSUER` | AMO API key (JWT issuer) |
| `FIREFOX_JWT_SECRET` | AMO API secret (JWT secret) |

The Firefox add-on ID is fixed in the manifest (`audio-sentinel@copyright-sentinel.local`) and in the workflow.
**Do not change it** after the first submission.

## Testing checklist

**Automated**
```bash
npm test && npm run lint && npm run build
```
CI runs the same checks on every pull request and every push to `main`.

**Manual: extension**

| Case | Expected |
|---|---|
| Play a catalogue song with a 3+ word title (e.g. "Aye Numba Na Kiya") | Caution card within 2 s, red **!** badge |
| Video whose title or channel has a 2+ word ACPOSL artist name | Card shows "ACPOSL member artist" |
| Unrelated video with "Amma" in the title | No card |
| Catalogue song, paused | No card |
| **Mute** / **Dismiss** buttons | Mutes the media / hides the card for that video |
| Move to a non-matching video | Card and badge disappear |
| Fullscreen | Card stays visible |
| Popup switch off | No cards anywhere |
| Song added in **My additions** | Always warns, even one-word titles |

**Manual: song-list update**
1. Add a test row to the catalogue (e.g. title `Shape of You`, artist `Ed Sheeran`), run `npm run rules`, and
   merge to `main`.
2. Wait 5–10 minutes, then click **Check for updates**. Expect "Updated" and the song count +1. The song now
   warns on YouTube.
3. Remove the row, regenerate, merge, then check for updates again. Expect the original count and no warning.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Popup: "Update check failed: HTTP 404" | `rules.json` isn't on `main`, or the repo is private. Merge to `main`; keep the repo public |
| "Up to date" right after pushing a new list | GitHub's raw cache (up to 5 min per node). Wait 5–10 minutes and check again |
| New list never arrives | The `version` didn't change. Regenerate with `npm run rules` instead of editing by hand |
| Chrome: "'background.scripts' requires manifest version of 2 or lower" | Only happens with a manifest that has `background.scripts`. The repo manifest must use only `service_worker`; CI adds `scripts` for Firefox |
| Firefox: no card appears | Allow the site in `about:addons` → the add-on → Permissions |
| No card on a site that isn't in the list | Expected by default. Click **Enable on all sites** in the popup, then reload the tab |
| No card on a site | Check the popup switch is on, media is actually playing, and the song or artist is in the catalogue (use the popup search) |
| CI: "Tag vX does not match manifest version" | Bump `"version"` in `extension/manifest.json` to match the tag. Delete the wrong tag with `git push origin :vX` |
| CI: Chrome upload fails, item in review | Wait for the current review to finish, then re-run the job |
| CI: Chrome `invalid_grant` | Refresh token expired. Publish the OAuth consent screen and generate a new token |

## Privacy

Full policy: [PRIVACY.md](PRIVACY.md).

- The extension reads page titles and media metadata **locally** to detect songs. Nothing about the user's
  browsing is collected, stored remotely, or sent anywhere.
- The only network request is downloading `rules.json` (song titles and artist names) from GitHub.
- Settings and the user's own additions stay in the browser's local extension storage.

## License

Proprietary. Copyright © 2026 Tharka Karunanayake. All rights reserved. See [LICENSE](LICENSE). This repository
is public so that the song list can be downloaded by the extension. Being public does **not** grant any right
to copy, modify, redistribute or publish the software.
