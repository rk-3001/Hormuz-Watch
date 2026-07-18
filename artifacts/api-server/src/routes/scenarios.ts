import { Router } from "express";
import { scenarios, computeScenarioResult, PRESET_INPUTS, type ScenarioInputs } from "../mockData";

const router = Router();

router.get("/scenarios", (_req, res) => {
  res.json(scenarios);
});

// POST /scenarios/custom/run — arbitrary inputs
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
  const result = computeScenarioResult({
    disruptionPercent,
    affectedCorridor: affectedCorridor as ScenarioInputs["affectedCorridor"],
    durationDays,
  });
  res.json(result);
});

// POST /scenarios/:id/run — preset scenario IDs
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
  res.json({ ...result, scenarioId: id, scenarioName: scenario.name });
});

export default router;
