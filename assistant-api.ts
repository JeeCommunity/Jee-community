import { Router } from "express";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const assistantRouter = Router();

// GET /openapi.json - OpenAPI spec for AI Studio
assistantRouter.get("/openapi.json", (req, res) => {
  const openapi = {
    "openapi": "3.1.0",
    "info": {
      "title": "Website API for NOVA",
      "version": "1.0.0",
      "description": "API for NOVA AI Assistant to read and write to the Live Study website."
    },
    "servers": [
      {
        "url": process.env.WEBSITE_API_URL || "https://ais-dev-7z74mvln6wxh7omqrc72ca-806584178069.asia-southeast1.run.app",
        "description": "Main API server"
      }
    ],
    "components": {
      "securitySchemes": {
        "ApiKeyAuth": {
          "type": "apiKey",
          "in": "header",
          "name": "x-api-key"
        }
      }
    },
    "security": [
      {
        "ApiKeyAuth": []
      }
    ],
    "paths": {
      "/api/assistant/posts": {
        "get": {
          "operationId": "getPosts",
          "summary": "Get recent posts",
          "parameters": [
            {
              "name": "limit",
              "in": "query",
              "schema": { "type": "integer", "default": 20 }
            }
          ],
          "responses": {
            "200": { "description": "List of posts" }
          }
        },
        "post": {
          "operationId": "createPost",
          "summary": "Create a new post",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "title": { "type": "string", "description": "Title of the post" },
                    "content": { "type": "string", "description": "Main content of the post" },
                    "tags": { "type": "array", "items": { "type": "string" }, "description": "Tags for the post, e.g. ['AI Update']" }
                  },
                  "required": ["title", "content"]
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Post created" }
          }
        }
      },
      "/api/assistant/posts/{postId}/comments": {
        "post": {
          "operationId": "replyToPost",
          "summary": "Reply to a specific post",
          "parameters": [
            {
              "name": "postId",
              "in": "path",
              "required": true,
              "schema": { "type": "string" }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "text": { "type": "string", "description": "The comment text to post" }
                  },
                  "required": ["text"]
                }
              }
            }
          },
          "responses": {
            "200": { "description": "Comment added" }
          }
        }
      },
      "/api/assistant/users": {
        "get": {
          "operationId": "getUsers",
          "summary": "Get list of users",
          "responses": {
            "200": { "description": "List of users" }
          }
        }
      }
    }
  };
  res.json(openapi);
});

// Middleware to check API Key
assistantRouter.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key || req.headers['authorization']?.replace('Bearer ', '');
  const validKey = process.env.WEBSITE_API_KEY;
  
  if (!validKey) {
    return res.status(500).json({ error: "WEBSITE_API_KEY is not configured on the server." });
  }
  
  if (apiKey !== validKey) {
    return res.status(401).json({ error: "Unauthorized. Invalid API key." });
  }
  
  next();
});

// GET /posts - Get community posts
assistantRouter.get("/posts", async (req, res) => {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit as string) || 20;
    const postsSnap = await db.collection("posts").orderBy("createdAt", "desc").limit(limit).get();
    const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /posts/:postId/comments - Add a comment to a post
assistantRouter.post("/posts/:postId/comments", async (req, res) => {
  try {
    const db = getFirestore();
    const postId = req.params.postId;
    const { text, authorName, authorId } = req.body;
    
    if (!text) return res.status(400).json({ error: "Text is required" });
    
    const postRef = db.collection("posts").doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return res.status(404).json({ error: "Post not found" });
    
    const commentData = {
      postId,
      text,
      authorId: authorId || "NOVA_AI",
      authorName: authorName || "NOVA Assistant",
      authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NOVA",
      createdAt: Date.now(),
      likes: 0
    };
    
    const docRef = await db.collection("comments").add(commentData);
    
    // Update post comments count
    await postRef.update({
      commentsCount: FieldValue.increment(1)
    });
    
    res.json({ success: true, commentId: docRef.id, data: commentData });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /users - Get users
assistantRouter.get("/users", async (req, res) => {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit as string) || 50;
    const snap = await db.collection("users").limit(limit).get();
    const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /posts - Create a new post
assistantRouter.post("/posts", async (req, res) => {
  try {
    const db = getFirestore();
    const { title, content, authorName, authorId, tags } = req.body;
    
    if (!title || !content) return res.status(400).json({ error: "Title and content are required" });
    
    const postData = {
      title,
      content,
      authorId: authorId || "NOVA_AI",
      authorName: authorName || "NOVA Assistant",
      authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=NOVA",
      tags: tags || ["AI Update"],
      createdAt: Date.now(),
      likes: 0,
      commentsCount: 0,
      views: 0
    };
    
    const docRef = await db.collection("posts").add(postData);
    res.json({ success: true, postId: docRef.id, data: postData });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

