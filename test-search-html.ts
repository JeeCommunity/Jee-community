import * as cheerio from "cheerio";

async function run() {
  const query = "latest NTA news";
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  const results: any[] = [];
  $(".result").each((i, el) => {
    const title = $(el).find(".result__title").text().trim();
    const snippet = $(el).find(".result__snippet").text().trim();
    const url = $(el).find(".result__url").attr("href");
    if (title && snippet) {
      results.push({ title, snippet, url });
    }
  });
  console.log(results.slice(0, 3));
}
run().catch(console.error);
