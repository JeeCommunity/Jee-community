import * as cheerio from "cheerio";

export async function liveSearch(query: string) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: any[] = [];
    $(".result").each((i, el) => {
      if (i >= 5) return;
      const title = $(el).find(".result__title").text().trim();
      const snippet = $(el).find(".result__snippet").text().trim();
      const url = $(el).find(".result__url").attr("href");
      if (title && snippet && url) {
        results.push({ title, snippet, url });
      }
    });
    return results.length > 0 ? results : null;
  } catch (e) {
    console.error("Search failed:", e);
    return null;
  }
}
