import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getGroqClient(): OpenAI {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

const VALID_CORRIDORS = ["hormuz", "redsea", "persian_gulf"] as const;
type Corridor = (typeof VALID_CORRIDORS)[number];

interface InterpretResult {
  disruptionPercent: number;
  affectedCorridor: Corridor;
  durationDays: number;
  confidence: "high" | "medium" | "low";
  interpretation: string;
}

const LOW_CONFIDENCE_DEFAULT: InterpretResult = {
  disruptionPercent: 30,
  affectedCorridor: "hormuz",
  durationDays: 7,
  confidence: "low",
  interpretation: "Could not confidently identify a supply disruption scenario. Defaults applied — please review and adjust.",
};

const SYSTEM_PROMPT = `You are a geopolitical supply-chain risk analyst. Given a plain-English description of a crude oil supply disruption, extract exactly three parameters and return ONLY a JSON object — no prose, no markdown fences, no explanation.

Return this shape:
{"disruptionPercent": <0-100>, "affectedCorridor": <"hormuz"|"redsea"|"persian_gulf">, "durationDays": <1-60>, "confidence": <"high"|"medium"|"low">, "interpretation": "<one sentence restating what you understood>"}

Rules:
- disruptionPercent: estimated % capacity disrupted. Full closure = 90-100. Partial attacks/threats = 30-60. Minor incidents = 10-30.
- affectedCorridor: "hormuz" for Strait of Hormuz / Iran / Gulf threats. "redsea" for Red Sea / Bab-el-Mandeb / Yemen / Houthis / Suez-adjacent. "persian_gulf" for Persian Gulf / OPEC+ / Saudi / UAE / Kuwait production.
- durationDays: estimated duration. "two weeks" = 14. "a month" = 30. "indefinitely" = 45. "briefly" = 3.
- confidence: "high" if scenario clearly describes a specific disruption. "medium" if plausible but vague. "low" if text is off-topic or too ambiguous.
- If text does not clearly describe a supply disruption, return confidence "low" with disruptionPercent 30, affectedCorridor "hormuz", durationDays 7.

Few-shot examples:

Input: "Iran threatens to close the Strait of Hormuz for two weeks"
Output: {"disruptionPercent":90,"affectedCorridor":"hormuz","durationDays":14,"confidence":"high","interpretation":"Iran threatens a full two-week closure of the Strait of Hormuz, potentially halting ~90% of throughput."}

Input: "Houthi attacks disrupt some Red Sea shipping lanes"
Output: {"disruptionPercent":40,"affectedCorridor":"redsea","durationDays":10,"confidence":"medium","interpretation":"Houthi militant attacks partially disrupt Red Sea shipping, estimated 40% capacity reduction over 10 days."}

Input: "OPEC+ announces an emergency 2 million barrel per day production cut"
Output: {"disruptionPercent":35,"affectedCorridor":"persian_gulf","durationDays":30,"confidence":"high","interpretation":"OPEC+ emergency production cut of ~2Mbpd from Persian Gulf members, sustained over approximately 30 days."}

Input: "what is the weather like today"
Output: {"disruptionPercent":30,"affectedCorridor":"hormuz","durationDays":7,"confidence":"low","interpretation":"Could not identify a supply disruption scenario. Defaults applied — please review and adjust."}`;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseAndValidate(raw: string): InterpretResult | null {
  // Strip code fences if present
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const disruptionPercent = typeof obj["disruptionPercent"] === "number"
    ? clamp(obj["disruptionPercent"], 0, 100)
    : null;
  const durationDays = typeof obj["durationDays"] === "number"
    ? clamp(Math.round(obj["durationDays"]), 1, 60)
    : null;
  const affectedCorridor = typeof obj["affectedCorridor"] === "string" &&
    VALID_CORRIDORS.includes(obj["affectedCorridor"] as Corridor)
    ? (obj["affectedCorridor"] as Corridor)
    : null;
  const confidence = ["high", "medium", "low"].includes(obj["confidence"] as string)
    ? (obj["confidence"] as "high" | "medium" | "low")
    : "low";
  const interpretation = typeof obj["interpretation"] === "string" && obj["interpretation"].trim()
    ? obj["interpretation"].trim()
    : "Scenario interpreted from provided text.";

  if (disruptionPercent === null || durationDays === null || affectedCorridor === null) return null;

  return { disruptionPercent, affectedCorridor, durationDays, confidence, interpretation };
}

router.post("/scenarios/interpret", async (req, res) => {
  const { text } = req.body as { text?: unknown };
  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  let result: InterpretResult;
  try {
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.trim() },
      ],
      temperature: 0.1,
      max_tokens: 256,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseAndValidate(raw);

    if (!parsed) {
      // LLM returned unparseable output — return low confidence defaults, not a 422
      // Only 422 if we genuinely can't recover at all
      result = { ...LOW_CONFIDENCE_DEFAULT };
    } else {
      result = parsed;
    }
  } catch (err) {
    // If the LLM call itself failed, return 422
    res.status(422).json({ error: "Could not interpret scenario" });
    return;
  }

  res.json(result);
});

export default router;
