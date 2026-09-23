import dotenv from "dotenv";
dotenv.config();

async function run() {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: "Who won the Indian general election 2024? What is the date today?" }],
      plugins: [{ id: "web", max_results: 3 }],
      max_tokens: 1500
    })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
