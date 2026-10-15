# github-trending-daily

A GitHub Action that snapshots [GitHub Trending](https://github.com/trending) every morning and saves the repos gaining the most stars that day as JSON.

- `trending.json` — the latest list, sorted by stars gained today
- `history/YYYY-MM-DD.json` — one snapshot per day

Each repo entry looks like:

```json
{
  "name": "owner/repo",
  "url": "https://github.com/owner/repo",
  "description": "…",
  "language": "TypeScript",
  "starsToday": 1234,
  "totalStars": 45678,
  "forks": 910
}
```

Runs via `.github/workflows/daily.yml`, attempting every 3 hours (GitHub often delays scheduled jobs by hours); the first successful run of each UTC day saves the snapshot and later runs skip. You can also trigger it manually from the **Actions** tab → **Daily GitHub trending snapshot** → **Run workflow**.

Run locally: `npm install && npm run scrape` (Node 20+).
