// Scrapes https://github.com/trending (daily) and saves the results as JSON.
// Output:
//   trending.json             -> always the latest list
//   history/YYYY-MM-DD.json   -> one file per day, so you build up a history

import { load } from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";

const URL = "https://github.com/trending?since=daily";

const toNumber = (text = "") => Number(text.replace(/[^\d]/g, "")) || 0;

export function parseTrending(html) {
  const $ = load(html);
  const repos = [];

  $("article.Box-row").each((_, el) => {
    const row = $(el);
    const name = (row.find("h2 a").attr("href") || "").replace(/^\//, "").trim();
    if (!name) return;

    const todayText = row
      .find("span")
      .filter((_, s) => /stars?\s+today/i.test($(s).text()))
      .first()
      .text();

    repos.push({
      name,
      url: `https://github.com/${name}`,
      description: row.find("p").first().text().trim(),
      language: row.find('[itemprop="programmingLanguage"]').text().trim() || null,
      starsToday: toNumber(todayText),
      totalStars: toNumber(row.find('a[href$="/stargazers"]').first().text()),
      forks: toNumber(row.find('a[href$="/forks"]').first().text()),
    });
  });

  // GitHub's own order isn't strictly by today's stars, so sort it.
  return repos.sort((a, b) => b.starsToday - a.starsToday);
}

async function main() {
  const res = await fetch(URL, {
    headers: { "User-Agent": "github-trending-daily (GitHub Actions)" },
  });
  if (!res.ok) throw new Error(`GitHub returned ${res.status}`);

  const repos = parseTrending(await res.text());
  if (repos.length === 0) {
    throw new Error("No repos found — GitHub may have changed the page layout.");
  }

  const date = new Date().toISOString().slice(0, 10);
  const data = { date, fetchedAt: new Date().toISOString(), source: URL, repos };
  const json = JSON.stringify(data, null, 2) + "\n";

  await mkdir("history", { recursive: true });
  await writeFile("trending.json", json);
  await writeFile(`history/${date}.json`, json);

  console.log(`Saved ${repos.length} repos for ${date}. Top: ${repos[0].name} (+${repos[0].starsToday})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
