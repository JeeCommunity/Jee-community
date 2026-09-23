import { search } from "duck-duck-scrape";

async function run() {
  const results = await search("latest NTA news");
  console.log("Results:");
  console.log(results.results.slice(0, 3).map(r => ({ title: r.title, description: r.description, url: r.url })));
}
run().catch(console.error);
