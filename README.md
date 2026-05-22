# -naukri-profile-bot
Auto-updates Naukri headline &amp; summary every 2 hrs

## Setup

Install dependencies:

```bash
npm ci
```

For local runs, create `.env` from the example file and fill in your Naukri credentials:

```bash
cp .env.example .env
```

Required variables:

```bash
NAUKRI_EMAIL=your-email@example.com
NAUKRI_PASSWORD=your-naukri-password
```

For GitHub Actions, add these as repository secrets:

- `NAUKRI_EMAIL`
- `NAUKRI_PASSWORD`

Then run:

```bash
node bot.js --once
```
