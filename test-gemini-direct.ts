import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const parts = [
        { text: "What is this?" },
        { inlineData: { data: imgBase64, mimeType: "image/png" } }
    ];
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts }],
        });
        console.log(response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
