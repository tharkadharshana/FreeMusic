# Step-by-Step Developer Setup & Release Checklist

This document details exactly what you need to do to publish your extension to the **Google Chrome Web Store** and **Mozilla Firefox Add-ons (AMO)**, and automate all future releases with GitHub.

---

## 1. Register Developer Accounts

### Google Chrome Web Store
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account.
3. Pay the one-time $5 developer registration fee.

### Mozilla Firefox Add-ons (AMO)
1. Go to the [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/).
2. Register your developer account (100% free).

---

## 2. Push Code to Your GitHub Repository

1. In the app, click **"Download Complete Git Repo ZIP"** or **"Download Extension (.ZIP)"**.
2. Extract the downloaded archive into a folder on your computer.
3. Open a terminal in that folder and run:

\`\`\`bash
# Initialize git and link to your repo
git init
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# Commit all files
git add .
git commit -m "feat: Initial release v1.1.0 for Audio Copyright Sentinel"
git push -u origin main
\`\`\`

---

## 3. Create the Initial Draft in Store Consoles

### For Chrome Web Store:
1. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), click **"Add new item"**.
2. Upload the \`Audio_Copyright_Sentinel_Extension.zip\` once manually.
3. Fill in your store listing (title, description, screenshots, privacy policy).
4. Copy your **Extension ID** (the 32-character string in the URL, e.g. \`abcdefghijklmnopabcdefghijklmnop\`).
5. Submit for initial review.

### For Firefox Add-ons:
1. In the [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/addon/submit/upload-listed), upload the ZIP file.
2. Note your **Add-on ID / slug**.

---

## 4. Obtain API Credentials for Automated CI/CD

To let GitHub Actions upload updates automatically without logging in:

### A. Chrome Web Store API Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. \`Chrome-Extension-Publisher\`).
3. Enable the **Chrome Web Store API**.
4. Navigate to **APIs & Services** → **OAuth consent screen** → Create External consent.
5. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID** → Application type: **Desktop app**.
6. Save your **Client ID** and **Client Secret**.
7. Generate your **Refresh Token** (using the Google OAuth 2.0 Playground with scope \`https://www.googleapis.com/auth/chromewebstore\`).

### B. Mozilla Firefox AMO API Credentials
1. Go to [AMO Developer API Keys](https://addons.mozilla.org/developers/addon/api/key/).
2. Click **Generate new credentials**.
3. Save your **JWT Issuer** (API Key) and **JWT Secret**.

---

## 5. Add Secrets to Your GitHub Repository

In your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** for each of the following:

| Secret Name | Value | Purpose |
| :--- | :--- | :--- |
| \`CHROME_EXTENSION_ID\` | Your 32-char extension ID | Target extension in Chrome store |
| \`CHROME_CLIENT_ID\` | Google Cloud OAuth Client ID | Chrome Web Store API authorization |
| \`CHROME_CLIENT_SECRET\` | Google Cloud OAuth Client Secret | Chrome Web Store API secret |
| \`CHROME_REFRESH_TOKEN\` | OAuth Refresh Token | Chrome Web Store token refresh |
| \`FIREFOX_ADDON_ID\` | Your Firefox extension UUID/slug | Target add-on in Mozilla AMO |
| \`FIREFOX_JWT_ISSUER\` | AMO API Key (JWT Issuer) | Firefox AMO authentication |
| \`FIREFOX_JWT_SECRET\` | AMO API Secret | Firefox AMO authentication |

---

## 6. How to Maintain Going Forward

### Scenario A: Adding New Restricted Songs / Updating Rules (Daily)
**Zero store delays!**
1. Update your Excel file in this web app or edit \`rules.json\`.
2. Commit and push:
   \`\`\`bash
   git commit -am "chore: Update restricted songs repository"
   git push origin main
   \`\`\`
3. **Done!** Every user's extension automatically fetches the new rules within hours via background alarms.

### Scenario B: Releasing New Features or Code Updates (Monthly)
1. Bump \`"version"\` in \`manifest.json\` (e.g. \`"1.1.0"\` → \`"1.2.0"\`).
2. Commit and push a version tag:
   \`\`\`bash
   git add .
   git commit -m "Release v1.2.0"
   git tag v1.2.0
   git push origin main --tags
   \`\`\`
3. **Done!** GitHub Actions automatically packages the ZIP, uploads to the Chrome Web Store API, and uploads & signs on Mozilla Firefox Add-ons!
