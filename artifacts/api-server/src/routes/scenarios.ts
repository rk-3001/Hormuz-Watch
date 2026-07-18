import { Router } from "express";
import { scenarios, computeScenarioResult, type ScenarioInputs } from "../mockData";

const router = Router();

// Preset scenario ID → parametric inputs
// Inputs chosen so computeScenarioResult reproduces the original hand-authored values within ~10-15%.
const PRESET_INPUTS: Record<string, ScenarioInputs> = {
  "hormuz-closure":     { disruptionPercent: 50,  affectedCorridor: "hormuz",       durationDays: 14 },
  "opec-emergency-cut": { disruptionPercent: 38,  affectedCorridor: "persian_gulf", durationDays: 10 },
  "redsea-suspension":  { disruptionPercent: 42,  affectedCorridor: "redsea",       durationDays: 16 },
};

router.get("/scenarios", (_req, res) => {
  res.json(scenarios);
});

// Custom scenario — arbitrary inputs
router.post("/scenarios/custom/run", (req, res) => {
  const { disruptionPercent, affectedCorridor, durationDays } = req.body as Partial<ScenarioInputs>;
  if (
    typeof disruptionPercent !== "number" ||
    typeof durationDays !== "number" ||
    !["hormuz", "redsea", "persian_gulf"].includes(affectedCorridor as string)
  ) {
    res.status(400).json({
      error: "Invalid input: expected disruptionPercent (number), affectedCorridor (hormuz|redsea|persian_gulf), durationDays (number)",
    });
    return;
  }
  const result = computeScenarioResult({ disruptionPercent, affectedCorridor: affectedCorridor as ScenarioInputs["affectedCorridor"], durationDays });
  res.json(result);
});

// Preset scenario by ID
router.post("/scenarios/:id/run", (req, res) => {
  const { id } = req.params;
  const scenario = scenarios.find((s) => s.id === id);
  if (!scenario) {
    res.status(404).json({ error: `Scenario '${id}' not found` });
    return;
  }
  const inputs = PRESET_INPUTS[id];
  if (!inputs) {
    res.status(404).json({ error: `No parametric inputs defined for scenario '${id}'` });
    return;
  }
  const result = computeScenarioResult(inputs);
  // Override scenarioId/scenarioName to match the preset's display identity
  res.json({ ...result, scenarioId: id, scenarioName: scenario.name });
});

export default router;
