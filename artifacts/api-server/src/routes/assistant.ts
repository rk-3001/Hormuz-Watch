import { Router } from "express";
import OpenAI from "openai";
import { corridorRisks } from "../mockData";
import { logger } from "../lib/logger";

const router = Router();

function getGrokClient(): OpenAI {
  const apiKey = process.env["GROK_API_KEY"];
  if (!apiKey) throw new Error("GROK_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

function buildSystemPrompt(): string {
  const scores = corridorRisks
    .map((c) => `${c.label}: ${c.currentScore.toFixed(0)}/100 (${c.trend})`)
    .join(", ");
  return `You are HormuzWatch AI, an expert energy supply chain risk analyst specializing in India's crude oil import security.

Current real-time risk context:
- Corridor Risk Scores: ${scores}
- India crude import dependency: 88% imported, ~40-45% via Strait of Hormuz
- Current SPR cover: ~9.5 days baseline
- Active monitoring: Strait of Hormuz, Red Sea/Bab-el-Mandeb, Persian Gulf

You have full knowledge of:
- Geopolitical developments affecting each corridor
- OPEC+ dynamics and production quota implications
- Available alternative crude sources: US WTI, West African Bonny Light, Russian ESPO, Saudi Yanbu bypass, Domestic ONGC
- Indian refinery grade compatibility and import logistics
- Strategic Reserve drawdown schedules

Respond as a senior analyst briefing a procurement director. Be specific, use real numbers where relevant, keep responses concise (3-5 sentences max unless the question requires detail). Never say you cannot access real-time data — use the provided risk context.`;
}

router.post("/assistant/chat", async (req, res) => {
  const { message, context } = req.body as { message: string; context?: string };
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    const client = getGrokClient();
    const userContent = context ? `${message}\n\nAdditional context: ${context}` : message;
    const response = await client.chat.completions.create({
      model: "grok-3",
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userContent },
      ],
    });
    const text = response.choices[0]?.message?.content ?? "No response generated.";
    res.json({ response: text, timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Grok API error");
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

export default router;
