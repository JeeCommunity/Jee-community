import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "Who won the recent Indian elections?",
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  console.log(response.text);
  console.log("Grounding Data:", JSON.stringify(response.candidates?.[0]?.groundingMetadata, null, 2));
}
run().catch(console.error);
