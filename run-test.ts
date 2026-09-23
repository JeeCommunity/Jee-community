import * as cheerio from "cheerio";

async function liveSearch(query: string) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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
      let url = $(el).find(".result__url").attr("href");
      if (url && url.includes("uddg=")) {
        try {
          const urlObj = new URL(url.startsWith("http") ? url : `https:${url}`);
          const uddg = urlObj.searchParams.get("uddg");
          if (uddg) url = decodeURIComponent(uddg);
        } catch (e) {}
      }
      if (title && snippet && url) {
        results.push({ title, snippet, url });
      }
    });
    return results.length > 0 ? results : null;
  } catch (e) {
    return null;
  }
}

async function test() {
  const messages = [{ role: "user", content: "Who is the AIR 1 of JEE Advanced 2026?" }];
  const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
  let searchContext = "";
  if (lastUserMessage) {
       const searchResults = await liveSearch(lastUserMessage.content);
       if (searchResults) {
         searchContext = `\n\n[LIVE SEARCH RESULTS]\nGoogle Search returned the following fresh information. Use this to answer the user accurately. Prioritize this information over internal knowledge.\n`;
         searchResults.forEach((r: any, idx: number) => {
           searchContext += `\n${idx + 1}. ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\n`;
         });
         searchContext += `\nAlways cite the URL using Markdown links.`;
       } else {
         searchContext = `\n\n[LIVE SEARCH] No recent search results found. Answer using your internal knowledge.`;
       }
  }

  const mappedMessages = messages.map((m: any) => ({ role: m.role === "model" ? "assistant" : "user", content: m.content }));
  if (searchContext && mappedMessages.length > 0) {
     mappedMessages[mappedMessages.length - 1].content += searchContext;
  }

  console.log("Mapped messages:\n", JSON.stringify(mappedMessages, null, 2));
}

test();
