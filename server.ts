import express from "express";
import { assistantRouter } from "./assistant-api";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { google } from "googleapis";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { resolveSessionState } from "./src/lib/sessionUtils";
import { getLocalDate } from "./src/lib/utils";

dotenv.config();

// Initialize Firebase Admin for Push Notifications
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
    console.log("Firebase Admin initialized successfully.");
    
    // Background Job: Close 3-hour sessions and notify
    setInterval(async () => {
      try {
        const db = getFirestore();
        const now = Date.now();
        const todayDate = getLocalDate();
        const sessionsSnap = await db.collection("study_sessions").where("isStudying", "==", true).get();
        
        for (const sessionDoc of sessionsSnap.docs) {
          const data = sessionDoc.data();
          if (data.startTime) {
            const timeStudied = Math.floor((now - data.startTime) / 1000);
            if (timeStudied >= 3 * 3600) {
              const targetUid = sessionDoc.id;
              
              // We resolve session state. Since timeStudied >= 3 * 3600, resolveSessionState will handle the 3-hour limit
              // and mark isStudying as false.
              const { baseTime, currentGoals, weeklyData, addedCoins, addedXP } = resolveSessionState(data, todayDate);
              
              weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };

              await db.collection("study_sessions").doc(targetUid).update({
                isStudying: false,
                activeGoalId: null,
                accumulatedTime: baseTime,
                goals: currentGoals,
                dailyDate: todayDate,
                weeklyData,
                lastUpdated: FieldValue.serverTimestamp(),
              });

              if (addedCoins > 0 || addedXP > 0) {
                await db.collection("users").doc(targetUid).set({
                  campus: {
                    totalCoins: FieldValue.increment(addedCoins),
                    totalXP: FieldValue.increment(addedXP)
                  }
                }, { merge: true });
              }

              // Send Push Notification
              const userSnap = await db.collection("users").doc(targetUid).get();
              if (userSnap.exists) {
                const userData = userSnap.data();
                if (userData?.fcmToken) {
                  try {
                    await getMessaging().send({
                      token: userData.fcmToken,
                      notification: {
                        title: "Study Slot Complete! 🎉",
                        body: "Your 3-hour study slot is complete! Great job. Do you want to start the next slot? Open the app to continue.",
                      },
                      data: {
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                        url: "/live-study"
                      }
                    });
                    console.log(`Sent auto-stop push notification to ${targetUid}`);
                  } catch (e) {
                    console.error(`Error sending auto-stop push to ${targetUid}:`, e);
                  }
                }
              }
            }
          }
        }
      } catch (e: any) {
        if (e && e.code === 8) {
          console.warn("Auto-stop cron skipped: Firebase Quota Exceeded (Resource Exhausted).");
        } else {
          console.error("Error in auto-stop cron:", e);
        }
      }
    }, 60 * 60 * 1000); // Check every 60 minutes to save Firestore quota

  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize admin:", error);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT is not set. Push notifications will not be sent to offline devices.");
}


const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// API routes for AI Assistant
app.use("/api/assistant", assistantRouter);

// Serve Service Worker dynamically with environment variables
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.type('application/javascript');
  res.send(`
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "${process.env.VITE_FIREBASE_API_KEY}",
  authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.VITE_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.VITE_FIREBASE_APP_ID}"
};

if (firebaseConfig.projectId && firebaseConfig.projectId !== "undefined") {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // Data-only message payload
    const notificationTitle = payload.data?.title || 'New Notification';
    const notificationOptions = {
      body: payload.data?.body,
      icon: payload.data?.icon || '/favicon.svg',
      data: payload.data,
      silent: false,
      vibrate: [200, 100, 200],
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  });
} else {
  console.log('[firebase-messaging-sw.js] Firebase Config missing.');
}
  `);
});


// Notification Endpoint
app.post("/api/dispatch-fcm", async (req, res) => {
  console.log("Received /api/dispatch-fcm request");
  if (!getApps().length) {
    return res.status(503).json({ error: "Firebase Admin not initialized" });
  }

  try {
    const { tokens, title, body, icon, data } = req.body;
    
    if (!tokens || !tokens.length) {
      return res.status(400).json({ error: "No tokens provided" });
    }


    // Ensure data payload has strings for everything (FCM requirement)
    const stringifiedData: any = {};
    const mergedData = { ...data, title, body, icon: icon || '/favicon.svg' };
    for (const key in mergedData) {
      if (mergedData[key] !== undefined && mergedData[key] !== null) {
        stringifiedData[key] = String(mergedData[key]);
      }
    }

    const message = {
      notification: { title, body },
      webpush: {
        notification: {
          icon: icon || '/favicon.svg',
          vibrate: [200, 100, 200]
        }
      },
      data: stringifiedData,
      tokens: tokens,
    };


    const response = await getMessaging().sendEachForMulticast(message);
    res.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    res.status(500).json({ error: String(error) });
  }
});


// Search function for Google Grounding
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
      // DuckDuckGo sometimes prepends //duckduckgo.com/l/?uddg=...
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
    console.error("Search failed:", e);
    return null;
  }
}


// API routes FIRST
app.post("/api/solve", async (req, res) => {
  try {
    const { problemText, images } = req.body;
    
    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "No AI API key is configured on the server." });
    }

    let prompt = `You are an expert JEE Main, JEE Advanced and Class 11–12 teacher.
Your goal is NOT just to solve the question.
Your primary goal is to make the student understand the concept in the simplest possible way.

Rules:
1. Solve every question like a real classroom teacher.
2. Never use a fixed template.
Choose the best and simplest method depending on the question.
3. If there is a shortcut method, teach that first.
If the shortcut is difficult to understand, explain the normal method first.
4. Explain WHY you are using each formula before substituting values.
5. Break the solution into small steps.
One idea per step.
6. Never skip important reasoning.
7. Avoid unnecessary theory.
Only explain what is needed to solve the question.
8. Use beginner-friendly language.
9. If a question can be solved in one step, do not create ten unnecessary steps.
10. If a question is difficult, divide it into smaller easy parts.
11. Never expose internal reasoning or chain of thought.
Only explain the mathematical or scientific reasoning that a student needs to learn.
12. If multiple methods exist, choose the easiest one and briefly mention another method only if it helps.
13. After solving, give one exam tip related to that concept.
14. Highlight common mistakes students usually make.
15. Use proper Markdown formatting.
16. STRICTLY format mathematical expressions cleanly using LaTeX inside $ for inline math and $$ for block math delimiters so it renders beautifully. DO NOT use \\( \\), \\[ \\], or plain brackets [ ] for math. ALWAYS use $ and $.
17. If the question is in Hindi or Hinglish, you MUST answer in simple Hinglish. NEVER answer in pure English if the user speaks Hinglish.
If the question is in English, answer in English.
18. If the question is from JEE Main, keep the explanation concise.
If it is JEE Advanced level, provide enough detail to understand the concept without making the answer unnecessarily long.
19. At the end, show only:
✅ Final Answer: [Your Answer Here]
20. Always think:
"If I were teaching this to a student sitting in front of me, how would I explain it so they truly understand?"
Never follow the same explanation style for every question.
Adapt your teaching style according to the difficulty, chapter, and type of question.
Your objective is understanding, not just solving.

The student's doubt is:
"${problemText || "Please solve the question in the image."}"`;

    const isVision = images && images.length > 0;
    let answer = "";

    // Method 1: Try Native Gemini API first
    const runGemini = async () => {
      if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini API key");
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parts: any[] = [{ text: prompt }];
      
      if (isVision) {
        for (const url of images) {
          const imgRes = await fetch(url);
          if (!imgRes.ok) throw new Error("Failed to fetch image for Gemini");
          const arrayBuffer = await imgRes.arrayBuffer();
          const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          parts.push({
            inlineData: {
              data: Buffer.from(arrayBuffer).toString("base64"),
              mimeType
            }
          });
        }
      }
      
      // We will use gemini-2.5-pro for best reasoning & accuracy, or fallback to flash
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: parts }]
      });
      let content = response.text || "";
      return content.replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    };

    // Method 2: Fallback to OpenRouter
    const runOpenRouter = async () => {
      if (!process.env.OPENROUTER_API_KEY) throw new Error("No OpenRouter API key");

      let messageContent: any = prompt;
      if (isVision) {
        messageContent = [
          { type: "text", text: prompt },
          ...images.map((imgUrl) => ({
            type: "image_url",
            image_url: { url: imgUrl }
          }))
        ];
      }

      const model = isVision ? "openai/gpt-4o-mini" : "deepseek/deepseek-r1";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: messageContent
            }
          ],
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter Error: ${await response.text()}`);
      }
      
      const result = await response.json();
      if (!result?.choices?.[0]?.message?.content) {
        throw new Error("Invalid OpenRouter format");
      }
      let content = result.choices[0].message.content;
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return content.replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    };

    try {
      console.log("Attempting Gemini API first...");
      answer = await runGemini();
      if(!answer) throw new Error("Gemini returned empty answer");
    } catch (geminiError) {
      console.warn("Gemini API failed, falling back to OpenRouter...", geminiError);
      try {
         answer = await runOpenRouter();
      } catch (openRouterError) {
         console.error("OpenRouter API also failed...", openRouterError);
         return res.status(500).json({ error: "All AI solvers are currently unavailable. Please check your API keys or try again later." });
      }
    }

    res.json({ answer });
  } catch (error) {
    console.error("Error calling AI solver:", error);
    res.status(500).json({ error: String(error) });
  }
});


app.post("/api/tutor-chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "No AI API key is configured on the server." });
    }

    const systemInstruction = `You are a friendly, encouraging, and expert AI Tutor for students preparing for JEE Main, JEE Advanced, and Class 11-12 exams.
- Today's date is ${new Date().toLocaleDateString()}. The current year is ${new Date().getFullYear()}.
- Explain concepts simply and clearly.
- Use analogies and step-by-step reasoning.
- Keep your answers concise, as this is a chat interface.
- Be supportive and motivating.
- STRICTLY use Markdown for formatting. For ANY mathematical equations or symbols, you MUST use LaTeX inside $ for inline math (e.g. $x^2$) and $$ for block math (e.g. $$y = mx + c$$). DO NOT use \\( \\), \\[ \\], or plain brackets [ ] for math. ALWAYS use $ and $.
- IF an image is provided (like a math, physics, or chemistry question or diagram), act as an AI Doubt Solver. Understand the question, explain the underlying concept, and give step-by-step hints to help the student solve it themselves instead of just giving the direct answer.
- IMPORTANT: ALWAYS reply in the EXACT SAME language the user uses in their prompt (e.g., if they ask in Hindi/Hinglish, you MUST reply in Hindi/Hinglish. NEVER reply in pure English if the user speaks Hinglish. If they ask in English, reply in English).
- When using live search results, YOU MUST cite your sources at the end of your answer as links (e.g., [Source Name](URL)).
- If the user just says a greeting (like "Hi", "Hello", "Hii", "Hey"), respond warmly as a tutor and ignore any search results.
- EXTREMELY IMPORTANT: ALWAYS trust the [LIVE SEARCH RESULTS] provided in the user's prompt. If the search results contain information about an event (like exam results, dates, or news), YOU MUST treat it as a factual event that has already occurred, regardless of your internal timeline or knowledge cutoff. Your absolute source of truth is the [LIVE SEARCH RESULTS].`;

    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
    let searchContext = "";
    let rankMatch = lastUserMessage ? lastUserMessage.content.match(/AIR\s*(\d+)/i) : null;
    let requiredRank = rankMatch ? rankMatch[1] : null;
    let fallbackRankString = requiredRank ? `I couldn't verify the AIR ${requiredRank} holder from reliable sources.` : "";

    if (lastUserMessage && !lastUserMessage.image && lastUserMessage.content.trim().length > 15) {
       console.log("Performing live search for:", lastUserMessage.content);
       const searchResults = await liveSearch(lastUserMessage.content);
       if (searchResults) {
         searchContext = `

[LIVE SEARCH RESULTS]
Google Search returned the following fresh information. Use this to answer the user accurately. Prioritize this information over internal knowledge.
`;
         searchResults.forEach((r: any, idx: number) => {
           searchContext += `
${idx + 1}. ${r.title}
URL: ${r.url}
Snippet: ${r.snippet}
`;
         });
         searchContext += `
Always cite the URL using Markdown links.`;
       } else {
         searchContext = `

[LIVE SEARCH] No recent search results found. Answer using your internal knowledge.`;
       }
    }

    const runGemini = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const formattedMessages = messages.map((m: any) => {
         const parts: any[] = [];
         if (m.content) parts.push({ text: m.content });
         if (m.image) {
            const base64Data = m.image.split(",")[1];
            const mimeType = m.image.match(/data:(.*?);base64/)[1];
            parts.push({
               inlineData: {
                  data: base64Data,
                  mimeType: mimeType
               }
            });
         }
         return { role: m.role, parts };
      });
      
      // Inject search results into the last message
      if (searchContext && formattedMessages.length > 0) {
         const lastIdx = formattedMessages.length - 1;
         formattedMessages[lastIdx].parts.push({ text: searchContext });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedMessages,
        config: { 
          systemInstruction,
        }
      });
      return response.text;
    };

    const runOpenRouter = async () => {
       const hasImage = messages.some((m: any) => m.image);
       const mappedMessages = messages.map((m: any) => {
         const content: any[] = [];
         if (m.content) content.push({ type: "text", text: m.content });
         if (m.image) {
            content.push({ type: "image_url", image_url: { url: m.image } });
         }
         return { 
           role: m.role === "model" ? "assistant" : "user", 
           content: hasImage ? content : (m.content || " ") 
         };
       });

       if (searchContext && mappedMessages.length > 0) {
         const lastMsg = mappedMessages[mappedMessages.length - 1];
         if (Array.isArray(lastMsg.content)) {
           lastMsg.content.push({ type: "text", text: searchContext });
         } else {
           lastMsg.content += searchContext;
         }
       }

       const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: hasImage ? "openai/gpt-4o-mini" : "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: systemInstruction },
            ...mappedMessages
          ],
          max_tokens: 1500
        })
      });

      if (!response.ok) throw new Error(`OpenRouter Error: ${await response.text()}`);
      
      const result = await response.json();
      let content = result.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      return content.replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    };

    let answer = "";
    try {
      if (process.env.GEMINI_API_KEY) {
         answer = await runGemini();
      } else {
         answer = await runOpenRouter();
      }
      console.log("Raw LLM answer:", answer);
      fs.writeFileSync('raw_llm_answer.txt', answer);

      // Manual post-processing for rank queries
      if (requiredRank) {
         // Check if the searchContext actually contained "AIR <rank>" or "Rank <rank>" 
         // or if the LLM's answer indicates it couldn't verify.
         // A simple heuristic: if search context does not explicitly mention the rank number
         // around words like AIR, Rank, etc, then we just output the fallback.
         const rankRegex = new RegExp(`(AIR|Rank)\\s*(:|-)?\\s*${requiredRank}\\b`, 'i');
         const isRankInContext = searchContext.match(rankRegex);
         
         if (!isRankInContext || answer.match(/couldn't verify/i)) {
           answer = fallbackRankString;
         }
      }
    } catch (e) {
      console.error("Gemini AI failed, falling back to OpenRouter:", e);
      if (process.env.OPENROUTER_API_KEY && process.env.GEMINI_API_KEY) {
         answer = await runOpenRouter();
         
         // Manual post-processing for rank queries (fallback)
         if (requiredRank) {
            const rankRegex = new RegExp(`(AIR|Rank)\\s*(:|-)?\\s*${requiredRank}\\b`, 'i');
            const isRankInContext = searchContext.match(rankRegex);
            if (!isRankInContext || answer.match(/couldn't verify/i)) {
              answer = fallbackRankString;
            }
         }
      } else {
         throw e;
      }
    }

    res.json({ text: answer });
  } catch (error) {
    console.error("Error calling Tutor AI:", error);
    res.status(500).json({ error: String(error) });
  }
});

app.get("/sitemap.xml", (req, res) => {
  try {
    const appTsx = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf-8");
    const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["'][^>]*>/g;
    let match;
    const paths = new Set(['/', '/community', '/login', '/signup', '/profile', '/posts']);
    
    while ((match = routeRegex.exec(appTsx)) !== null) {
      if (match[1] !== '/' && match[1] !== '*') {
        paths.add(match[1].startsWith('/') ? match[1] : '/' + match[1]);
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(paths).map(p => `  <url>
    <loc>https://jee-11-community.ai.studio${p}</loc>
    <changefreq>daily</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

app.post('/api/check-drive-link', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Invalid URL' });

    // 1. Extract file ID from URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return res.json({ isPublic: true }); // Bypass check if not a standard drive link format
    }
    const fileId = match[1];

    // 2. Check for credentials
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!apiKey && !serviceAccountJson) {
      console.warn('Neither GOOGLE_DRIVE_API_KEY nor GOOGLE_SERVICE_ACCOUNT_JSON is configured. Bypassing check.');
      return res.json({ isPublic: true }); 
    }

    // 3. Verify public access using Google Drive API
    try {
      let authClient;
      if (serviceAccountJson) {
        try {
          const credentials = JSON.parse(serviceAccountJson);
          authClient = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
          });
        } catch (e) {
          console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Ensure it is a valid JSON string.");
          return res.json({ isPublic: true }); // Bypass to not block user
        }
      } else {
        authClient = apiKey;
      }

      const drive = google.drive({ version: 'v3', auth: authClient });
      await drive.files.get({
        fileId: fileId,
        fields: 'id',
      });
      return res.json({ isPublic: true });
    } catch (apiError) {
      console.error('Drive API Check Failed:', apiError.message);
      if (apiError.message && (apiError.message.includes('API key not valid') || apiError.message.includes('API key') || apiError.message.includes('invalid_grant'))) {
        console.warn('Credentials invalid. Bypassing check to not block user.');
        return res.json({ isPublic: true });
      }
      return res.json({ isPublic: false });
    }
  } catch (error) {
    console.error('Error checking drive link:', error);
    return res.json({ isPublic: true, error: true });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const db = getFirestore();
    const statsDoc = await db.collection('admin_stats').doc('counters').get();
    if (statsDoc.exists) {
      res.json(statsDoc.data());
    } else {
      res.json({ users: 0, posts: 0 });
    }
  } catch (error: any) {
    if (error?.code === 8 || error?.message?.includes('Quota')) {
      console.warn("Quota exceeded fetching admin stats. Falling back to 0.");
      res.json({ users: 0, posts: 0 });
    } else {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
});

app.post('/api/admin/stats/:type/:action', async (req, res) => {
  try {
    const { type, action } = req.params;
    const db = getFirestore();
    const incrementVal = action === 'increment' ? 1 : -1;
    
    const updateData: any = {};
    if (type === 'users') updateData.users = FieldValue.increment(incrementVal);
    if (type === 'posts') updateData.posts = FieldValue.increment(incrementVal);
    
    await db.collection('admin_stats').doc('counters').set(updateData, { merge: true });
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === 8 || error?.message?.includes('Quota')) {
      console.warn("Quota exceeded updating admin stats. Ignoring.");
      res.json({ success: false, reason: "quota_exceeded" });
    } else {
      console.error("Error updating admin stats:", error);
      res.status(500).json({ error: "Failed to update stats" });
    }
  }
});

app.post('/api/admin/send-reminders', async (req, res) => {
  try {
    const { subject, message, emails, actionUrl, actionText } = req.body;

    if (!subject || !message || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: "Invalid request payload." });
    }
    
    const gmailUser = process.env.GMAIL_USER || 'jeecommunity.updates@gmail.com';
    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: "Server email app password is not configured." });
    }

    // Respond immediately to prevent any client timeout / fetch fail
    res.json({ success: true, message: `Email broadcast started for ${emails.length} users!` });

    // Process in background non-blocking
    setImmediate(async () => {
      try {
        const targetUrl = actionUrl || "https://jee-community.netlify.app";
        const targetText = actionText || "Open JEE Community App 🚀";

        const cleanedPassword = (process.env.GMAIL_APP_PASSWORD || "").replace(/[\s\u00A0-]/g, "");

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: (process.env.GMAIL_USER || "").trim(),
            pass: cleanedPassword,
          }
        });

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 9999px; margin-bottom: 12px;">
                  <span style="color: #ffffff; font-size: 13px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">🎓 IIT-JEE Aspirants Community</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">JEE Community</h1>
                <p style="color: #e0e7ff; margin: 6px 0 0; font-size: 14px;">Free Doubt Solving • Notes Hub • Live Study Groups</p>
              </div>

              <!-- Body Content -->
              <div style="padding: 32px 28px; color: #1e293b; line-height: 1.7; font-size: 15px;">
                <div style="white-space: pre-wrap; word-break: break-word;">${message.replace(/\n/g, '<br>')}</div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 36px 0 20px;">
                  <a href="${targetUrl}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                    ${targetText}
                  </a>
                </div>

                <div style="text-align: center; margin-top: 10px;">
                  <a href="${targetUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">${targetUrl}</a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 6px 0;">You received this update because you are a verified member of the JEE Community platform.</p>
                <p style="margin: 0;">© ${new Date().getFullYear()} JEE Community. All rights reserved.</p>
              </div>

            </div>
          </body>
          </html>
        `;

        let sentCount = 0;

        for (const recipientEmail of emails) {
          if (!recipientEmail || !recipientEmail.includes('@')) continue;

          try {
            const mailOptions = {
              from: '"JEE Community" <' + gmailUser + '>',
              to: recipientEmail,
              subject: subject,
              html: htmlContent
            };

            await transporter.sendMail(mailOptions);
            sentCount += 1;
            console.log(`Direct email sent to ${recipientEmail}`);
          } catch (err: any) {
            console.error(`Failed to send direct email to ${recipientEmail}:`, err?.message);
          }
          // Small delay to prevent Gmail rate limits
          await new Promise(r => setTimeout(r, 300));
        }
        console.log(`Broadcast completed successfully to ${sentCount} users.`);
      } catch (bgErr) {
        console.error("Background email dispatch error:", bgErr);
      }
    });

  } catch (error: any) {
    console.error("Error initiating emails:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send emails: " + error.message });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (clientWs) => {
    console.log("Client connected to Live API WebSocket");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const session = await ai.live.connect({
        model: "gemini-2.0-flash-exp",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a friendly, encouraging, and expert AI Tutor for students preparing for JEE Main, JEE Advanced, and Class 11-12 exams. Respond in the language the user speaks (e.g. Hindi/Hinglish). Keep your answers concise, as this is a voice conversation. Use simple terms to explain complex concepts.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) clientWs.send(JSON.stringify({ audio }));
            if (message.serverContent?.interrupted)
              clientWs.send(JSON.stringify({ interrupted: true }));
          },
        },
      });

      clientWs.on("message", async (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: parsed.audio
              }
            });
          } else if (parsed.setup) {
             const messages = parsed.messages || [];
             let contextText = "Here is the previous chat context before the user started the voice session:\n";
             messages.forEach((m: any) => {
                contextText += `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}
`;
                if (m.image) {
                   contextText += `[Student attached an image]
`;
                }
             });
             
             await session.sendClientContent({
                turns: [
                  {
                    role: "user",
                    parts: [
                       { text: contextText },
                       { text: "Voice chat has now started! Please briefly acknowledge the context and ask what I would like to discuss next. Keep it natural, conversational and very brief (1-2 sentences). Do not mention that you received the context text." }
                    ]
                  }
                ],
                turnComplete: true
             });
          }
        } catch (err) {
          console.error("Error processing websocket message:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("Client disconnected, closing session");
        session.close();
      });
    } catch (err) {
      console.error("Error connecting to Gemini Live API:", err);
      clientWs.close();
    }
  });
}

startServer();
