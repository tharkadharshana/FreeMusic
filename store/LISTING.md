# Store listing copy

Copy and paste these into the Chrome Web Store and Firefox Add-ons forms. Assets are in this folder.

## Basics

| Field | Value |
|---|---|
| Name | Audio Copyright Sentinel |
| Summary (max 132 characters) | Get a caution card when a song from the ACPOSL (Sri Lanka) public catalogue plays in your browser. |
| Category | Chrome: **Tools** · Firefox: **Other** (or Search Tools) |
| Language | English |
| Privacy policy URL | https://github.com/tharkadharshana/FreeMusic/blob/main/PRIVACY.md |
| Homepage / support URL | https://github.com/tharkadharshana/FreeMusic |
| Firefox licence | All Rights Reserved |

## Description

```
Using music in a video, stream, shop or event? Audio Copyright Sentinel tells you when a song you're playing
appears in the ACPOSL public catalogue, so you can check before you use it.

HOW IT WORKS
• Works on YouTube, YouTube Music, Spotify Web, SoundCloud, Facebook, Instagram and TikTok.
• Want it everywhere? One click on "Enable on all sites" covers any site with an audio or video player.
• If the song or artist is in the catalogue, a caution card appears in the corner of the page, and a red
  badge appears on the toolbar icon.
• Mute the audio or dismiss the card with one click.

SMART MATCHING, FEW FALSE ALARMS
• Matches song titles together with their credited artists, so common one-word titles like "Amma" don't
  trigger on unrelated videos.
• Also flags well-known ACPOSL member artists by name.
• Add your own songs under "My additions". They always warn.

ALWAYS UP TO DATE
• Ships with 4,169 songs and 361 artist names.
• The song list updates automatically in the background. No reinstall needed.
• Search the catalogue from the toolbar popup: "Is this song listed?"

PRIVATE BY DESIGN
• Everything happens locally in your browser.
• No accounts, no tracking, no analytics. Your browsing is never collected or sent anywhere.

IMPORTANT
The catalogue is compiled from public sources and is not a legal ownership register. A warning means "check
with ACPOSL before using this song". No warning does not mean a song is free to use. This extension is not
affiliated with ACPOSL.
```

## Chrome: Privacy practices tab

| Field | Answer |
|---|---|
| Single purpose | Warns the user when a song from the ACPOSL public catalogue plays in a browser tab. |
| `storage` justification | Saves the song list, the on/off setting and the user's own added songs locally. |
| `alarms` justification | Refreshes the song list from the developer's GitHub repository every 6 hours. |
| `scripting` justification | Only used if the user clicks "Enable on all sites" in the popup and grants the optional all-sites permission: it registers the same song-detection content script for sites beyond the default music sites. Never used to inject code into pages without that opt-in. |
| Host permission justification | The content script runs on a fixed list of music sites (YouTube, YouTube Music, Spotify Web, SoundCloud, Facebook, Instagram and TikTok) because that is where users play songs. On a page where media is playing it reads only the page title, the Media Session track title/artist, on YouTube the channel name and video description (including its "Music" section), and on YouTube Shorts, TikTok, Instagram and Facebook the sound label of the post on screen, and compares them locally with the bundled song list to decide whether to show the caution card. Nothing is stored, logged or transmitted. Access to all other sites is an optional permission that the user can grant from the popup ("Enable on all sites"); it is never requested at install. |
| Remote code | **No, I am not using remote code.** The downloaded `rules.json` contains only song titles and artist names (data), never executable code. |
| Data usage | Tick **none** of the data types. Certify all three statements (no selling, no unrelated use, no creditworthiness use). |

## Firefox: submission notes

| Field | Answer |
|---|---|
| Source code required? | **No.** All code is plain, unminified JavaScript included in the package. |
| Data collection | Declared in the manifest as `"required": ["none"]`. |
| Notes for reviewer | The extension reads page titles, Media Session metadata and the song labels sites print on the page locally to match against a bundled song list (`rules.json`). It periodically fetches an updated `rules.json` (data only) from raw.githubusercontent.com. No user data is collected or transmitted. |

## Assets

| File | Size | Use |
|---|---|---|
| `screenshot-1-caution.png` | 1280×800 | Caution card on a playing song |
| `screenshot-2-search.png` | 1280×800 | Popup: search the catalogue |
| `screenshot-3-dark.png` | 1280×800 | Dark mode, artist match |
| `promo-small-440x280.png` | 440×280 | Chrome small promo tile (24-bit, no alpha) |
| `marquee-1400x560.png` | 1400×560 | Chrome marquee promo tile (24-bit, no alpha) |
| `store-icon-128.png` | 128×128 | Chrome store icon: 96×96 artwork + 16 px transparent padding, per Chrome image guidelines |
