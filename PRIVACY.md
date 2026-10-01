# Privacy Policy — Audio Copyright Sentinel

_Last updated: 1 October 2026_

Audio Copyright Sentinel ("the extension") is developed and owned by Tharka Karunanayake. This policy explains
what the extension does with data. In short: **it collects nothing about you.**

## What the extension reads

To detect whether a song from the ACPOSL public catalogue is playing, the extension reads, **locally in your
browser**, the following on pages where audio or video is playing. By default this happens only on YouTube, YouTube Music, Spotify Web, SoundCloud, Facebook, Instagram and TikTok;
on other sites only if you click "Enable on all sites" in the popup (you can turn this off again at any time):

- the page title;
- media information the page publishes through the browser's Media Session API (track title and artist);
- on YouTube, the channel name and the video description shown on the page, including the "Music" section that
  names the song used in the video;
- on YouTube Shorts, TikTok, Instagram and Facebook, the sound or audio label shown on the post that is on screen.

This information is compared against the song list stored inside the extension. It is never stored, logged,
or sent anywhere.

## What the extension stores

Only in your browser's local extension storage:

- the song list (song titles and artist names from the public catalogue);
- your on/off setting;
- songs you add yourself under "My additions";
- the time of the last song-list update and any update error message.

You can delete all of this at any time by removing the extension.

## Network requests

The extension makes one kind of network request: it downloads the song list (`rules.json`) from
`https://raw.githubusercontent.com/tharkadharshana/FreeMusic/main/extension/rules.json` about every 6 hours,
when the browser starts, and when you click "Check for updates". This request sends no personal data. GitHub
may log standard request information, such as your IP address, under
[GitHub's privacy statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).

## What the extension does not do

- No analytics, tracking, advertising, or telemetry.
- No account, sign-in, or personal information.
- No browsing history is collected, sold, or shared with anyone.
- No remote code is downloaded or run. The song list is data only.

## Changes

If this policy changes, the updated version will be published at this address with a new "Last updated" date.

## Contact

Questions about this policy: open an issue at https://github.com/tharkadharshana/FreeMusic/issues or contact
the owner via https://github.com/tharkadharshana.
