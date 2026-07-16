import { Router } from "express";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { logger } from "../../lib/logger";

const router = Router();

function getGroqClient(): OpenAI {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

// GET /anthropic/conversations
router.get("/conversations", async (_req, res) => {
  try {
    const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /anthropic/conversations
router.post("/conversations", async (req, res) => {
  const { title } = req.body as { title: string };
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  try {
    const [row] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /anthropic/conversations/:id
router.get("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    logger.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /anthropic/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /anthropic/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    logger.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /anthropic/conversations/:id/messages  (SSE streaming)
router.post("/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { content } = req.body as { content: string };
  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.insert(messages).values({ conversationId: id, role: "user", content });

    // Fetch full history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are HormuzWatch AI, a specialized energy supply chain risk analyst. Help users understand geopolitical risks to India's crude oil supply, scenario impacts, procurement options, and reserve strategies.",
      },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Stream response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const client = getGroqClient();
    let fullResponse = "";

    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Streaming message error");
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
    res.end();
  }
});

export default router;
